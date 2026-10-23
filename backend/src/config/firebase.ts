import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { env } from "./env";

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  if (!env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    console.warn(
      "[firebase] FIREBASE_SERVICE_ACCOUNT_PATH not set — FCM push notifications are disabled."
    );
    return;
  }

  const resolvedPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_PATH);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(
      `[firebase] Service account file not found at ${resolvedPath} — FCM push notifications are disabled.`
    );
    return;
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  initialized = true;
  console.log("[firebase] Firebase Admin initialized");
}

export function isFirebaseReady(): boolean {
  return initialized;
}

export { admin };
