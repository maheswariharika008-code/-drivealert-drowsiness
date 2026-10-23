import { Request, Response } from "express";
import { Types } from "mongoose";
import { Alert, AlertStatus } from "../models/Alert";
import { Session } from "../models/Session";
import { User } from "../models/User";
import { ok, created, fail } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { emitToDriver } from "../sockets";
import { sendDrowsyAlertPush } from "../services/fcmService";

interface IngestAlertBody {
  driverId: string;
  sessionId: string;
  fatigueScore: number;
  status: AlertStatus;
  blinkCount: number;
  yawnCount: number;
  reasons: string[];
  timestamp: number; // unix seconds, from the AI service
}

/**
 * Called by the Python AI service (authenticated via x-api-key, not JWT)
 * whenever it computes a Warning/Drowsy state. This is the single place
 * where an alert becomes: persisted -> pushed to dashboard -> pushed to phone.
 */
export async function ingestAlert(req: Request, res: Response) {
  const body = req.body as IngestAlertBody;

  if (!body.driverId || !body.sessionId || body.fatigueScore === undefined || !body.status) {
    return fail(res, "driverId, sessionId, fatigueScore, and status are required", 400);
  }

  const [driver, session] = await Promise.all([
    User.findById(body.driverId),
    Session.findById(body.sessionId),
  ]);
  if (!driver) return fail(res, "Driver not found", 404);
  if (!session) return fail(res, "Session not found", 404);

  const alert = await Alert.create({
    driver: driver._id,
    session: session._id,
    fatigueScore: body.fatigueScore,
    status: body.status,
    blinkCount: body.blinkCount ?? 0,
    yawnCount: body.yawnCount ?? 0,
    reasons: body.reasons ?? [],
    timestamp: body.timestamp ? new Date(body.timestamp * 1000) : new Date(),
  });

  // 1. Real-time update to the web dashboard
  emitToDriver(String(driver._id), "alert:new", {
    id: alert._id,
    fatigueScore: alert.fatigueScore,
    status: alert.status,
    blinkCount: alert.blinkCount,
    yawnCount: alert.yawnCount,
    reasons: alert.reasons,
    timestamp: alert.timestamp,
  });

  // 2. Push notification to the mobile app (only for the full Drowsy state,
  //    not the intermediate Warning tier, to avoid alert fatigue)
  if (alert.status === "Drowsy") {
    await sendDrowsyAlertPush({
      driver,
      alertId: alert._id as any,
      fatigueScore: alert.fatigueScore,
      reasons: alert.reasons,
    });
  }

  return created(res, alert, "Alert ingested");
}

export async function listAlerts(req: AuthedRequest, res: Response) {
  const { range = "today", limit = "50" } = req.query as Record<string, string>;
  const limitNum = Math.min(parseInt(limit, 10) || 50, 200);

  const since = new Date();
  if (range === "today") since.setHours(0, 0, 0, 0);
  else if (range === "week") since.setDate(since.getDate() - 7);
  else if (range === "month") since.setMonth(since.getMonth() - 1);
  else since.setFullYear(2000); // "all"

  const alerts = await Alert.find({ driver: req.userId, timestamp: { $gte: since } })
    .sort({ timestamp: -1 })
    .limit(limitNum);

  return ok(res, alerts);
}

export async function alertStats(req: AuthedRequest, res: Response) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);
  const startOfMonth = new Date(now);
  startOfMonth.setMonth(now.getMonth() - 1);

  const driverFilter = { driver: req.userId };

  const [todayCount, weekCount, monthCount, dailyBreakdown] = await Promise.all([
    Alert.countDocuments({ ...driverFilter, status: "Drowsy", timestamp: { $gte: startOfToday } }),
    Alert.countDocuments({ ...driverFilter, status: "Drowsy", timestamp: { $gte: startOfWeek } }),
    Alert.countDocuments({ ...driverFilter, status: "Drowsy", timestamp: { $gte: startOfMonth } }),
    Alert.aggregate([
      { $match: { driver: new Types.ObjectId(req.userId), timestamp: { $gte: startOfMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          totalAlerts: { $sum: 1 },
          drowsyAlerts: { $sum: { $cond: [{ $eq: ["$status", "Drowsy"] }, 1, 0] } },
          avgScore: { $avg: "$fatigueScore" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return ok(res, {
    todayAlerts: todayCount,
    weekAlerts: weekCount,
    monthAlerts: monthCount,
    dailyBreakdown,
  });
}
