import { Router } from "express";
import * as alertController from "../controllers/alertController";
import { requireAuth } from "../middleware/auth";
import { requireServiceKey } from "../middleware/serviceAuth";

const router = Router();

// Machine-to-machine: called by the Python AI service, not the browser/app
router.post("/", requireServiceKey, alertController.ingestAlert);

// Driver-facing
router.get("/", requireAuth, alertController.listAlerts);
router.get("/stats", requireAuth, alertController.alertStats);

export default router;
