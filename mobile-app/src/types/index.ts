export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleNumber: string;
  profilePhoto?: string;
  createdAt: string;
}

export type AlertStatus = "Safe" | "Warning" | "Drowsy";

export interface AlertRecord {
  _id: string;
  driver: string;
  session: string;
  fatigueScore: number;
  status: AlertStatus;
  blinkCount: number;
  yawnCount: number;
  reasons: string[];
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

/** Payload data carried on the FCM push (see backend fcmService.ts) */
export interface DrowsyPushData {
  type: "DROWSY_ALERT";
  alertId: string;
  fatigueScore: string;
}
