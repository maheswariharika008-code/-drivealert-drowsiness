import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SessionStatus = "active" | "ended";

export interface ISession extends Document {
  driver: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  durationSec: number;
  avgFatigueScore: number;
  maxFatigueScore: number;
  totalAlerts: number;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    durationSec: { type: Number, default: 0 },
    avgFatigueScore: { type: Number, default: 0 },
    maxFatigueScore: { type: Number, default: 0 },
    totalAlerts: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "ended"], default: "active", index: true },
  },
  { timestamps: true }
);

export const Session: Model<ISession> = mongoose.model<ISession>("Session", SessionSchema);
