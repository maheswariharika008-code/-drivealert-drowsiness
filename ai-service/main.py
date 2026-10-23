"""
AI Drowsiness Detection Service
--------------------------------
Captures the local webcam, runs MediaPipe-based drowsiness detection on
every frame, and:
  1. Streams live metrics + annotated JPEG frames to the web dashboard
     over WebSocket (/ws/monitor).
  2. Pushes DROWSY alerts to the Node.js backend over HTTP, which is
     responsible for persisting to MongoDB and firing FCM push
     notifications to the mobile app.

Run:
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""
import asyncio
import base64
import json
import threading
import time
from typing import Optional

import cv2
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import CFG
from detector import DrowsinessDetector

app = FastAPI(title="Drowsiness Detection AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CFG.CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CameraSession:
    """Owns the webcam capture thread and the latest computed state."""

    def __init__(self):
        self.detector: Optional[DrowsinessDetector] = None
        self.capture: Optional[cv2.VideoCapture] = None
        self.thread: Optional[threading.Thread] = None
        self.running = False
        self.lock = threading.Lock()
        self.latest_state: dict = {
            "status": "Idle",
            "face_visible": False,
            "ear": None,
            "mar": None,
            "eyes_closed": False,
            "eyes_closed_duration": 0.0,
            "yawning": False,
            "head_down": False,
            "head_tilted": False,
            "blink_count": 0,
            "yawn_count": 0,
            "blink_rate_per_min": None,
            "fatigue_score": 0,
            "active_reasons": [],
        }
        self.latest_jpeg: Optional[bytes] = None
        self.driver_id: Optional[str] = None
        self.session_id: Optional[str] = None
        self._last_alert_sent_at = 0.0

    def start(self, driver_id: str, session_id: str):
        with self.lock:
            if self.running:
                return
            self.driver_id = driver_id
            self.session_id = session_id
            self.detector = DrowsinessDetector()
            self.capture = cv2.VideoCapture(CFG.CAMERA_INDEX)
            self.capture.set(cv2.CAP_PROP_FRAME_WIDTH, CFG.FRAME_WIDTH)
            self.capture.set(cv2.CAP_PROP_FRAME_HEIGHT, CFG.FRAME_HEIGHT)
            if not self.capture.isOpened():
                self.capture = None
                self.detector = None
                raise RuntimeError("Could not open webcam. Check CAMERA_INDEX / permissions.")
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()

    def stop(self) -> Optional[dict]:
        with self.lock:
            self.running = False
            summary = self.detector.session_summary() if self.detector else None
            if self.capture:
                self.capture.release()
            if self.detector:
                self.detector.close()
            self.capture = None
            self.detector = None
            self.latest_state = {
                "status": "Idle",
                "face_visible": False,
                "ear": None,
                "mar": None,
                "eyes_closed": False,
                "eyes_closed_duration": 0.0,
                "yawning": False,
                "head_down": False,
                "head_tilted": False,
                "blink_count": 0,
                "yawn_count": 0,
                "blink_rate_per_min": None,
                "fatigue_score": 0,
                "active_reasons": [],
            }
            self.latest_jpeg = None
            return summary

    def _run_loop(self):
        frame_interval = 1.0 / CFG.TARGET_FPS
        while self.running:
            start = time.time()
            ok, frame = self.capture.read()
            if not ok:
                time.sleep(frame_interval)
                continue

            frame = cv2.flip(frame, 1)
            state = self.detector.process_frame(frame)
            self._draw_overlay(frame, state)

            ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            with self.lock:
                self.latest_state = state
                if ok:
                    self.latest_jpeg = buf.tobytes()

            if state["status"] == "Drowsy":
                self._maybe_send_alert(state)

            elapsed = time.time() - start
            time.sleep(max(0.0, frame_interval - elapsed))

    @staticmethod
    def _draw_overlay(frame, state: dict):
        color = {"Safe": (0, 200, 0), "Warning": (0, 165, 255), "Drowsy": (0, 0, 255)}.get(
            state["status"], (255, 255, 255)
        )
        cv2.putText(frame, f"Status: {state['status']}", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        cv2.putText(frame, f"Score: {state['fatigue_score']}", (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        if state.get("ear") is not None:
            cv2.putText(frame, f"EAR: {state['ear']}  MAR: {state['mar']}", (10, 75),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        if not state["face_visible"]:
            cv2.putText(frame, "NO FACE DETECTED", (10, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    def _maybe_send_alert(self, state: dict):
        now = time.time()
        if now - self._last_alert_sent_at < CFG.ALERT_COOLDOWN_SEC:
            return
        self._last_alert_sent_at = now
        payload = {
            "driverId": self.driver_id,
            "sessionId": self.session_id,
            "fatigueScore": state["fatigue_score"],
            "status": state["status"],
            "blinkCount": state["blink_count"],
            "yawnCount": state["yawn_count"],
            "reasons": state["active_reasons"],
            "timestamp": state["timestamp"],
        }
        threading.Thread(target=self._post_alert_sync, args=(payload,), daemon=True).start()

    @staticmethod
    def _post_alert_sync(payload: dict):
        url = f"{CFG.BACKEND_BASE_URL}{CFG.BACKEND_ALERT_ENDPOINT}"
        headers = {"x-api-key": CFG.SERVICE_API_KEY, "Content-Type": "application/json"}
        try:
            httpx.post(url, json=payload, headers=headers, timeout=5.0)
        except httpx.HTTPError as exc:
            print(f"[ai-service] Failed to POST alert to backend: {exc}")


session = CameraSession()


def _check_key(x_api_key: Optional[str]):
    if x_api_key != CFG.SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing x-api-key")


@app.get("/health")
def health():
    return {"ok": True, "service": "ai-drowsiness-detection", "running": session.running}


@app.post("/api/session/start")
def start_session(driver_id: str, session_id: str, x_api_key: Optional[str] = Header(None)):
    _check_key(x_api_key)
    try:
        session.start(driver_id, session_id)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"ok": True, "message": "Session started", "sessionId": session_id}


@app.post("/api/session/stop")
def stop_session(x_api_key: Optional[str] = Header(None)):
    _check_key(x_api_key)
    summary = session.stop()
    return {"ok": True, "message": "Session stopped", "summary": summary}


@app.get("/api/session/current")
def current_state(x_api_key: Optional[str] = Header(None)):
    _check_key(x_api_key)
    with session.lock:
        return session.latest_state


@app.websocket("/ws/monitor")
async def ws_monitor(websocket: WebSocket):
    """Streams {metrics, frame} JSON to the dashboard at TARGET_FPS."""
    await websocket.accept()
    try:
        while True:
            with session.lock:
                state = dict(session.latest_state)
                jpeg = session.latest_jpeg
            payload = {"metrics": state}
            if jpeg is not None:
                payload["frame"] = base64.b64encode(jpeg).decode("ascii")
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0 / CFG.TARGET_FPS)
    except WebSocketDisconnect:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
