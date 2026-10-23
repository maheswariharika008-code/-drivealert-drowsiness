"""
Standalone sanity-check script.

Runs the detector directly against your webcam and shows a live OpenCV
window with the overlay -- no FastAPI, backend, or database needed.
Use this first to confirm your webcam + MediaPipe are working and to
tune thresholds in config.py before wiring up the rest of the stack.

Run:
    pip install -r requirements.txt
    python local_test.py

Press 'q' to quit.
"""
import cv2
from config import CFG
from detector import DrowsinessDetector
from main import CameraSession  # reuse the overlay drawing helper


def main():
    cap = cv2.VideoCapture(CFG.CAMERA_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CFG.FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CFG.FRAME_HEIGHT)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam. Check CAMERA_INDEX in config.py.")

    detector = DrowsinessDetector()
    print("Press 'q' to quit.")

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)
            state = detector.process_frame(frame)
            CameraSession._draw_overlay(frame, state)

            if state["status"] == "Drowsy":
                print(f"[ALERT] DROWSY  score={state['fatigue_score']}  reasons={state['active_reasons']}")

            cv2.imshow("Drowsiness Detection - Local Test", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()
        print("Session summary:", detector.session_summary())


if __name__ == "__main__":
    main()
