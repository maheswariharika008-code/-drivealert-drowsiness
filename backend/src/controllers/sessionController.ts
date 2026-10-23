import { Response } from "express";
import { Session } from "../models/Session";
import { Alert } from "../models/Alert";
import { ok, created, fail } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";

export async function startSession(req: AuthedRequest, res: Response) {
  const existingActive = await Session.findOne({ driver: req.userId, status: "active" });
  if (existingActive) {
    return ok(res, existingActive, "An active session already exists");
  }
  const session = await Session.create({ driver: req.userId, startTime: new Date(), status: "active" });
  return created(res, session, "Session started");
}

export async function stopSession(req: AuthedRequest, res: Response) {
  const { sessionId } = req.params;
  const session = await Session.findOne({ _id: sessionId, driver: req.userId });
  if (!session) return fail(res, "Session not found", 404);
  if (session.status === "ended") return ok(res, session, "Session already ended");

  const alerts = await Alert.find({ session: session._id });
  const scores = alerts.map((a) => a.fatigueScore);

  session.endTime = new Date();
  session.durationSec = Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000);
  session.totalAlerts = alerts.filter((a) => a.status === "Drowsy").length;
  session.avgFatigueScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  session.maxFatigueScore = scores.length ? Math.max(...scores) : 0;
  session.status = "ended";
  await session.save();

  return ok(res, session, "Session ended");
}

export async function listSessions(req: AuthedRequest, res: Response) {
  const { limit = "20", page = "1" } = req.query as Record<string, string>;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);

  const [sessions, total] = await Promise.all([
    Session.find({ driver: req.userId })
      .sort({ startTime: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Session.countDocuments({ driver: req.userId }),
  ]);

  return ok(res, { sessions, total, page: pageNum, limit: limitNum });
}

export async function getSession(req: AuthedRequest, res: Response) {
  const session = await Session.findOne({ _id: req.params.sessionId, driver: req.userId });
  if (!session) return fail(res, "Session not found", 404);
  const alerts = await Alert.find({ session: session._id }).sort({ timestamp: 1 });
  return ok(res, { session, alerts });
}
