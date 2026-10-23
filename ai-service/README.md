# AI Drowsiness Detection Service (Phase 1)

Python + OpenCV + MediaPipe Face Mesh service that watches the driver
through the laptop webcam and computes a live fatigue score.

## What it does

- **EAR (Eye Aspect Ratio)** on both eyes → detects eye closure & counts blinks
- **MAR (Mouth Aspect Ratio)** → detects yawning
- **Head pose (solvePnP)** → detects head-down / head-tilt
- **Face presence tracking** → detects "face missing" (driver out of frame)
- **Blink-rate window (60s)** → flags abnormally low/high blink rate
- **Time-decayed Fatigue Score** → matches your spec exactly:
  - Eyes closed > 2s → **+3**
  - Yawning → **+2**
  - Head down → **+2**
  - Face missing → **+3**
  - Abnormal blink rate → **+1**
  - **Score ≥ 6 → `Drowsy`**, 3–5 → `Warning` (early-warning tier for the
    dashboard UI, not in your original spec but useful before full alarm),
    else `Safe`

## Files

```
ai-service/
├── config.py       # All thresholds — tune here, no logic changes needed
├── detector.py      # Core CV logic: EAR/MAR/head pose/scoring (unit-tested)
├── main.py          # FastAPI service: webcam thread, WebSocket stream, alert POST
├── local_test.py     # Standalone webcam window test — no backend needed
├── requirements.txt
└── .env.example
```

## Quick start (test on your laptop, no backend needed yet)

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python local_test.py
```

This opens a webcam window with live EAR/MAR/score overlay. Press `q` to quit.
Console prints `[ALERT] DROWSY ...` whenever the score crosses the threshold.
Use this to tune `EAR_THRESHOLD` / `MAR_THRESHOLD` in `config.py` to your face
and lighting before wiring up the rest of the stack.

## Running as the real service (once Phase 2 backend exists)

```bash
cp .env.example .env      # set BACKEND_BASE_URL + AI_SERVICE_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### API

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness check |
| `/api/session/start?driver_id=..&session_id=..` | POST | Opens the webcam, starts detection (requires `x-api-key` header) |
| `/api/session/stop` | POST | Stops capture, returns session summary |
| `/api/session/current` | GET | Latest metrics snapshot |
| `/ws/monitor` | WebSocket | Streams `{metrics, frame(base64 jpg)}` at ~15fps — the dashboard connects here for the live feed + live numbers |

When `status` becomes `Drowsy`, the service automatically `POST`s an alert
payload to `BACKEND_BASE_URL/api/alerts` (10s cooldown so it doesn't spam).
The Node backend (Phase 2) is responsible for saving it to MongoDB and
triggering the Firebase push notification to the mobile app.

## Why not send the alarm sound from here

Per your architecture, the AI service's job is detection + alerting the
backend — not playing sound. The audible alarm lives in two places:
- **Dashboard (browser)**: plays a sound on `Drowsy` status via the
  WebSocket event (built in Phase 3).
- **Mobile app**: plays the loud alarm + vibrates via FCM push, which
  survives background/locked-screen — this is the reliable one for an
  actual driver (built in Phase 4).

## Verified

- EAR is lower for a closed eye than an open eye ✅
- MAR is higher for an open mouth than a closed mouth ✅
- FatigueScorer produces `Drowsy` at score ≥ 6, `Warning` at 3–5, `Safe`
  below that, with events decaying after `SCORE_EVENT_TTL_SEC` (8s) so a
  single old event doesn't hold the score up forever ✅
- All modules import and run cleanly with `mediapipe==0.10.14` (pin this
  exact version — newer builds on some platforms ship without the legacy
  `mediapipe.solutions` API) ✅

## Next phase

Phase 2 (Node/Express/MongoDB backend) will expose `/api/alerts`,
`/api/sessions`, auth, and a Socket.IO relay so the React dashboard gets
real-time updates without talking to the AI service directly.
