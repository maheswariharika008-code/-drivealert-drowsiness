import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { DrowsyPushData } from "../types";

/**
 * Determines how a notification is presented while the app is in the
 * foreground. We still want the OS-level sound/vibration to fire even
 * though the app is open, since the driver may not be looking at the
 * screen — that's the entire point of this alert.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Creates the Android notification channel with a custom alarm sound and
 * max-priority/heads-up behavior, matching what the backend's fcmService
 * requests (channelId: "drowsiness_alerts").
 */
export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("drowsiness_alerts", {
    name: "Drowsiness Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 800, 400, 800, 400, 800],
    sound: "alarm.wav",
    lightColor: "#FB4141",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true,
  });
}

/**
 * Requests notification permission and returns the Expo push token, which
 * the app registers with the backend via POST /api/auth/device-token.
 * Returns null on simulators/emulators or if permission is denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("[notifications] Push notifications require a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("[notifications] Permission not granted for push notifications.");
    return null;
  }

  await configureNotificationChannel();

  const tokenResponse = await Notifications.getDevicePushTokenAsync();
  return tokenResponse.data;
}

export type DrowsyNotificationHandler = (data: DrowsyPushData) => void;

/**
 * Wires up listeners for both states:
 *  - Foreground: fires while the app is open, used to trigger the in-app
 *    alarm screen + local sound/vibration immediately.
 *  - Response (tap or background delivery interaction): fires when the
 *    driver taps the system notification, e.g. app was backgrounded.
 * Returns a cleanup function to remove both subscriptions.
 */
export function subscribeToDrowsyAlerts(onDrowsyAlert: DrowsyNotificationHandler): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as unknown as DrowsyPushData;
    if (data?.type === "DROWSY_ALERT") {
      onDrowsyAlert(data);
    }
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as unknown as DrowsyPushData;
    if (data?.type === "DROWSY_ALERT") {
      onDrowsyAlert(data);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
