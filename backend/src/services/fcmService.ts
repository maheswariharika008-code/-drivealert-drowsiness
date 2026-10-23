import { admin, isFirebaseReady } from "../config/firebase";
import { IUser } from "../models/User";
import { Notification } from "../models/Notification";
import { Types } from "mongoose";

interface DrowsyPushPayload {
  driver: IUser;
  alertId: Types.ObjectId;
  fatigueScore: number;
  reasons: string[];
}

/**
 * Sends a "wake up" push notification to every FCM token registered for the
 * driver (they may be logged in on more than one device), logs delivery
 * result to the Notification collection, and prunes tokens Firebase reports
 * as no-longer-registered.
 */
export async function sendDrowsyAlertPush({
  driver,
  alertId,
  fatigueScore,
  reasons,
}: DrowsyPushPayload): Promise<void> {
  const title = "Wake Up! You appear to be sleepy.";
  const body = `Fatigue score ${fatigueScore}. Reasons: ${reasons.join(", ") || "drowsiness detected"}. Please take a break.`;

  if (!isFirebaseReady() || driver.fcmTokens.length === 0) {
    await Notification.create({
      driver: driver._id,
      alert: alertId,
      title,
      body,
      delivered: false,
      error: !isFirebaseReady() ? "Firebase not configured" : "No registered device tokens",
    });
    return;
  }

  const message: import("firebase-admin").messaging.MulticastMessage = {
    tokens: driver.fcmTokens,
    notification: { title, body },
    data: {
      type: "DROWSY_ALERT",
      alertId: String(alertId),
      fatigueScore: String(fatigueScore),
    },
    android: {
      priority: "high",
      notification: {
        sound: "alarm",
        channelId: "drowsiness_alerts",
        priority: "max",
      },
    },
    apns: {
      payload: {
        aps: { sound: "alarm.caf", contentAvailable: true },
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    const staleTokens: string[] = [];
    response.responses.forEach((r, idx) => {
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        staleTokens.push(driver.fcmTokens[idx]);
      }
    });
    if (staleTokens.length > 0) {
      driver.fcmTokens = driver.fcmTokens.filter((t) => !staleTokens.includes(t));
      await driver.save();
    }

    await Notification.create({
      driver: driver._id,
      alert: alertId,
      title,
      body,
      delivered: response.successCount > 0,
      error: response.failureCount > 0 ? `${response.failureCount} token(s) failed` : undefined,
    });
  } catch (err) {
    console.error("[fcm] Failed to send push:", err);
    await Notification.create({
      driver: driver._id,
      alert: alertId,
      title,
      body,
      delivered: false,
      error: err instanceof Error ? err.message : "Unknown FCM error",
    });
  }
}
