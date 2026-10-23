import { Router } from "express";
import * as sessionController from "../controllers/sessionController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/start", requireAuth, sessionController.startSession);
router.post("/:sessionId/stop", requireAuth, sessionController.stopSession);
router.get("/", requireAuth, sessionController.listSessions);
router.get("/:sessionId", requireAuth, sessionController.getSession);

export default router;
