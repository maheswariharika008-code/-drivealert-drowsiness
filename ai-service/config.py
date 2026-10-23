"""
Configuration for the AI Drowsiness Detection Service.
All thresholds are tunable here without touching detection logic.
"""
import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()  # reads .env in this folder into environment variables


@dataclass
class Thresholds:
    # ---- Eye Aspect Ratio (EAR) ----
    EAR_THRESHOLD: float = 0.21          # Below this = eye considered closed
    EAR_CONSEC_FRAMES_BLINK: int = 2     # Min consecutive frames below threshold to count as a blink
    EYES_CLOSED_DURATION_SEC: float = 2.0  # Eyes closed longer than this = fatigue event

    # ---- Mouth Aspect Ratio (MAR) / Yawning ----
    MAR_THRESHOLD: float = 0.6
    YAWN_CONSEC_FRAMES: int = 15          # ~0.5s at 30fps sustained open mouth = a yawn

    # ---- Head Pose ----
    HEAD_DOWN_PITCH_DEG: float = 20.0     # Pitch angle beyond this (chin down) = head down
    HEAD_TILT_ROLL_DEG: float = 25.0      # Roll angle beyond this = head tilted sideways

    # ---- Face Visibility ----
    FACE_MISSING_CONSEC_FRAMES: int = 15  # ~0.5s of no face detected = "face missing"

    # ---- Blink rate (per rolling 60s window) ----
    NORMAL_BLINK_RATE_MIN: int = 8        # Below this per minute = abnormal (too few, sign of staring/microsleep)
    NORMAL_BLINK_RATE_MAX: int = 30       # Above this per minute = abnormal (excessive blinking, fatigue)
    BLINK_RATE_WINDOW_SEC: int = 60

    # ---- Fatigue score weights (matches spec) ----
    SCORE_EYES_CLOSED: int = 3
    SCORE_YAWNING: int = 2
    SCORE_HEAD_DOWN: int = 2
    SCORE_FACE_MISSING: int = 3
    SCORE_BLINK_ABNORMAL: int = 1

    # ---- Score decay so old events don't permanently hold the score up ----
    SCORE_EVENT_TTL_SEC: float = 8.0

    # ---- Classification ----
    DROWSY_SCORE_THRESHOLD: int = 6
    WARNING_SCORE_THRESHOLD: int = 3      # 3-5 => "Warning", >=6 => "Drowsy", else "Safe"


@dataclass
class ServiceConfig:
    CAMERA_INDEX: int = 0
    FRAME_WIDTH: int = 640
    FRAME_HEIGHT: int = 480
    TARGET_FPS: int = 15                  # Processing/streaming rate to dashboard

    BACKEND_BASE_URL: str = os.getenv("BACKEND_BASE_URL", "http://localhost:5000")
    BACKEND_ALERT_ENDPOINT: str = "/api/alerts"
    BACKEND_STATUS_ENDPOINT: str = "/api/sessions/status"
    SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "change-me-shared-secret")

    ALERT_COOLDOWN_SEC: float = 10.0      # Don't spam backend with duplicate DROWSY alerts

    CORS_ORIGINS: tuple = ("http://localhost:3000", "http://localhost:5173")


THRESH = Thresholds()
CFG = ServiceConfig()
