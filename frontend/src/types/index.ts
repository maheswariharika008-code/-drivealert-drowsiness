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

export interface SessionRecord {
  _id: string;
  driver: string;
  startTime: string;
  endTime?: string;
  durationSec: number;
  avgFatigueScore: number;
  maxFatigueScore: number;
  totalAlerts: number;
  status: "active" | "ended";
}

export interface AlertStats {
  todayAlerts: number;
  weekAlerts: number;
  monthAlerts: number;
  dailyBreakdown: {
    _id: string;
    totalAlerts: number;
    drowsyAlerts: number;
    avgScore: number;
  }[];
}

/** Live metrics streamed from the AI service over WebSocket (/ws/monitor) */
export interface LiveMetrics {
  timestamp: number;
  face_visible: boolean;
  ear: number | null;
  mar: number | null;
  pitch: number | null;
  yaw: number | null;
  roll: number | null;
  eyes_closed: boolean;
  eyes_closed_duration: number;
  yawning: boolean;
  head_down: boolean;
  head_tilted: boolean;
  blink_count: number;
  yawn_count: number;
  blink_rate_per_min: number | null;
  fatigue_score: number;
  status: "Safe" | "Warning" | "Drowsy" | "Idle";
  active_reasons: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}
