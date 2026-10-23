import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  driver: Types.ObjectId;
  alert?: Types.ObjectId;
  title: string;
  body: string;
  delivered: boolean;
  error?: string;
  sentAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    alert: { type: Schema.Types.ObjectId, ref: "Alert" },
    title: { type: String, required: true },
    body: { type: String, required: true },
    delivered: { type: Boolean, default: false },
    error: { type: String },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
