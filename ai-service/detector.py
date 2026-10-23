"""
Core computer-vision logic for drowsiness detection.

Uses MediaPipe Face Mesh (468 landmarks) to compute:
  - Eye Aspect Ratio (EAR)          -> eye closure / blink detection
  - Mouth Aspect Ratio (MAR)        -> yawning detection
  - Head pose (pitch/yaw/roll)      -> head-down / head-tilt detection via solvePnP
  - Face presence                   -> face-missing detection
  - A rolling, time-decayed Fatigue Score -> Safe / Warning / Drowsy classification
"""
import time
import math
from collections import deque
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np
import mediapipe as mp

from config import THRESH, CFG

mp_face_mesh = mp.solutions.face_mesh

# ---- Landmark index groups (MediaPipe Face Mesh, 468-point model) ----
LEFT_EYE = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33, 160, 158, 133, 153, 144]
MOUTH_TOP = 13
MOUTH_BOTTOM = 14
MOUTH_LEFT = 78
MOUTH_RIGHT = 308

# 3D model points (generic face model, in mm) used for solvePnP head pose estimation
MODEL_POINTS_3D = np.array([
    (0.0, 0.0, 0.0),          # Nose tip        -> landmark 1
    (0.0, -63.6, -12.5),      # Chin            -> landmark 152
    (-43.3, 32.7, -26.0),     # Left eye corner -> landmark 263
    (43.3, 32.7, -26.0),      # Right eye corner-> landmark 33
    (-28.9, -28.9, -24.1),    # Left mouth corner -> landmark 291
    (28.9, -28.9, -24.1),     # Right mouth corner-> landmark 61
], dtype=np.float64)
POSE_LANDMARK_IDS = [1, 152, 263, 33, 291, 61]


def _euclidean(p1, p2) -> float:
    return math.hypot(p1[0] - p2[0], p1[1] - p2[1])


def eye_aspect_ratio(landmarks, indices) -> float:
    p = [landmarks[i] for i in indices]
    vertical_1 = _euclidean(p[1], p[5])
    vertical_2 = _euclidean(p[2], p[4])
    horizontal = _euclidean(p[0], p[3])
    if horizontal == 0:
        return 0.0
    return (vertical_1 + vertical_2) / (2.0 * horizontal)


def mouth_aspect_ratio(landmarks) -> float:
    top = landmarks[MOUTH_TOP]
    bottom = landmarks[MOUTH_BOTTOM]
    left = landmarks[MOUTH_LEFT]
    right = landmarks[MOUTH_RIGHT]
    vertical = _euclidean(top, bottom)
    horizontal = _euclidean(left, right)
    if horizontal == 0:
        return 0.0
    return vertical / horizontal


@dataclass
class ScoreEvent:
    reason: str
    points: int
    timestamp: float = field(default_factory=time.time)


class FatigueScorer:
    """Maintains a rolling, time-decayed fatigue score built from weighted events."""

    def __init__(self):
        self.events: deque[ScoreEvent] = deque()

    def add(self, reason: str, points: int):
        # Avoid duplicate spam of the same reason within a short window
        now = time.time()
        recent_same = [e for e in self.events if e.reason == reason and now - e.timestamp < 1.5]
        if recent_same:
            return
        self.events.append(ScoreEvent(reason, points, now))

    def _prune(self):
        now = time.time()
        while self.events and now - self.events[0].timestamp > THRESH.SCORE_EVENT_TTL_SEC:
            self.events.popleft()

    def score(self) -> int:
        self._prune()
        return sum(e.points for e in self.events)

    def active_reasons(self) -> list[str]:
        self._prune()
        return sorted({e.reason for e in self.events})

    def classify(self) -> str:
        s = self.score()
        if s >= THRESH.DROWSY_SCORE_THRESHOLD:
            return "Drowsy"
        if s >= THRESH.WARNING_SCORE_THRESHOLD:
            return "Warning"
        return "Safe"


class DrowsinessDetector:
    """Stateful per-session detector. Call process_frame() once per captured frame."""

    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.6,
            min_tracking_confidence=0.5,
        )
        self.scorer = FatigueScorer()

        # Blink / eye-closure tracking
        self.eye_closed_frames = 0
        self.eye_closed_since: Optional[float] = None
        self.blink_count = 0
        self.blink_timestamps: deque[float] = deque()
        self._eye_was_closed = False

        # Yawn tracking
        self.yawn_frames = 0
        self.yawn_count = 0
        self._yawn_active = False

        # Face missing tracking
        self.face_missing_frames = 0

        # Session bookkeeping
        self.session_start = time.time()

    # ---------------------------------------------------------------- #
    def _estimate_head_pose(self, landmarks, frame_shape):
        h, w = frame_shape[:2]
        image_points = np.array(
            [(landmarks[i][0] * w, landmarks[i][1] * h) for i in POSE_LANDMARK_IDS],
            dtype=np.float64,
        )
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        success, rotation_vec, _ = cv2.solvePnP(
            MODEL_POINTS_3D, image_points, camera_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            return 0.0, 0.0, 0.0

        rotation_mat, _ = cv2.Rodrigues(rotation_vec)
        pose_mat = np.hstack((rotation_mat, np.zeros((3, 1))))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
        pitch, yaw, roll = [float(a[0]) for a in euler_angles]
        return pitch, yaw, roll

    # ---------------------------------------------------------------- #
    def process_frame(self, frame: np.ndarray) -> dict:
        """Run detection on a single BGR frame. Returns a metrics dict."""
        now = time.time()
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        state = {
            "timestamp": now,
            "face_visible": False,
            "ear": None,
            "mar": None,
            "pitch": None,
            "yaw": None,
            "roll": None,
            "eyes_closed": False,
            "eyes_closed_duration": 0.0,
            "yawning": False,
            "head_down": False,
            "head_tilted": False,
            "blink_count": self.blink_count,
            "yawn_count": self.yawn_count,
            "blink_rate_per_min": self._current_blink_rate(now),
            "fatigue_score": 0,
            "status": "Safe",
            "active_reasons": [],
        }

        if not results.multi_face_landmarks:
            self.face_missing_frames += 1
            if self.face_missing_frames >= THRESH.FACE_MISSING_CONSEC_FRAMES:
                self.scorer.add("face_missing", THRESH.SCORE_FACE_MISSING)
            state["fatigue_score"] = self.scorer.score()
            state["status"] = self.scorer.classify()
            state["active_reasons"] = self.scorer.active_reasons()
            return state

        self.face_missing_frames = 0
        state["face_visible"] = True

        landmarks = [(lm.x, lm.y) for lm in results.multi_face_landmarks[0].landmark]

        # ---- EAR / blink / eye closure ----
        left_ear = eye_aspect_ratio(landmarks, LEFT_EYE)
        right_ear = eye_aspect_ratio(landmarks, RIGHT_EYE)
        ear = (left_ear + right_ear) / 2.0
        state["ear"] = round(ear, 3)

        eyes_closed_now = ear < THRESH.EAR_THRESHOLD
        if eyes_closed_now:
            self.eye_closed_frames += 1
            if self.eye_closed_since is None:
                self.eye_closed_since = now
            self._eye_was_closed = True
        else:
            if self._eye_was_closed and self.eye_closed_frames >= THRESH.EAR_CONSEC_FRAMES_BLINK:
                self.blink_count += 1
                self.blink_timestamps.append(now)
            self.eye_closed_frames = 0
            self.eye_closed_since = None
            self._eye_was_closed = False

        closed_duration = (now - self.eye_closed_since) if self.eye_closed_since else 0.0
        state["eyes_closed"] = eyes_closed_now
        state["eyes_closed_duration"] = round(closed_duration, 2)
        if closed_duration >= THRESH.EYES_CLOSED_DURATION_SEC:
            self.scorer.add("eyes_closed", THRESH.SCORE_EYES_CLOSED)

        # ---- MAR / yawning ----
        mar = mouth_aspect_ratio(landmarks)
        state["mar"] = round(mar, 3)
        yawning_now = mar > THRESH.MAR_THRESHOLD
        if yawning_now:
            self.yawn_frames += 1
        else:
            if self._yawn_active and self.yawn_frames >= THRESH.YAWN_CONSEC_FRAMES:
                self.yawn_count += 1
            self.yawn_frames = 0
        self._yawn_active = yawning_now
        state["yawning"] = self.yawn_frames >= THRESH.YAWN_CONSEC_FRAMES
        if state["yawning"]:
            self.scorer.add("yawning", THRESH.SCORE_YAWNING)

        # ---- Head pose ----
        pitch, yaw, roll = self._estimate_head_pose(landmarks, frame.shape)
        state["pitch"], state["yaw"], state["roll"] = round(pitch, 1), round(yaw, 1), round(roll, 1)
        head_down = abs(pitch) > THRESH.HEAD_DOWN_PITCH_DEG
        head_tilted = abs(roll) > THRESH.HEAD_TILT_ROLL_DEG
        state["head_down"] = head_down
        state["head_tilted"] = head_tilted
        if head_down:
            self.scorer.add("head_down", THRESH.SCORE_HEAD_DOWN)

        # ---- Blink rate abnormality ----
        blink_rate = self._current_blink_rate(now)
        state["blink_rate_per_min"] = blink_rate
        if blink_rate is not None and (
            blink_rate < THRESH.NORMAL_BLINK_RATE_MIN or blink_rate > THRESH.NORMAL_BLINK_RATE_MAX
        ):
            self.scorer.add("blink_rate_abnormal", THRESH.SCORE_BLINK_ABNORMAL)

        state["blink_count"] = self.blink_count
        state["yawn_count"] = self.yawn_count
        state["fatigue_score"] = self.scorer.score()
        state["status"] = self.scorer.classify()
        state["active_reasons"] = self.scorer.active_reasons()
        return state

    def _current_blink_rate(self, now: float) -> Optional[float]:
        while self.blink_timestamps and now - self.blink_timestamps[0] > THRESH.BLINK_RATE_WINDOW_SEC:
            self.blink_timestamps.popleft()
        elapsed = now - self.session_start
        if elapsed < 10:
            return None  # not enough data yet
        window = min(elapsed, THRESH.BLINK_RATE_WINDOW_SEC)
        return round(len(self.blink_timestamps) * (60.0 / window), 1)

    def session_summary(self) -> dict:
        now = time.time()
        return {
            "start_time": self.session_start,
            "end_time": now,
            "duration_sec": round(now - self.session_start, 1),
            "total_blinks": self.blink_count,
            "total_yawns": self.yawn_count,
            "final_score": self.scorer.score(),
        }

    def close(self):
        self.face_mesh.close()
