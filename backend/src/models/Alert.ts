import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AlertStatus = "Safe" | "Warning" | "Drowsy";

export interface IAlert extends Document {
  driver: Types.ObjectId;
  session: Types.ObjectId;
  fatigueScore: number;
  status: AlertStatus;
  blinkCount: number;
  yawnCount: number;
  reasons: string[];
  timestamp: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    session: { type: Schema.Types.ObjectId, ref: "Session", required: true, index: true },
    fatigueScore: { type: Number, required: true },
    status: { type: String, enum: ["Safe", "Warning", "Drowsy"], required: true, index: true },
    blinkCount: { type: Number, default: 0 },
    yawnCount: { type: Number, default: 0 },
    reasons: { type: [String], default: [] },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Alert: Model<IAlert> = mongoose.model<IAlert>("Alert", AlertSchema);
