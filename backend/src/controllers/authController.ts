import { Response } from "express";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";
import { User } from "../models/User";
import { signAuthToken, signResetToken, verifyResetToken } from "../utils/jwt";
import { ok, created, fail } from "../utils/apiResponse";
import { AuthedRequest } from "../middleware/auth";
import { env } from "../config/env";

function publicUser(user: any) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    vehicleNumber: user.vehicleNumber,
    profilePhoto: user.profilePhoto,
    createdAt: user.createdAt,
  };
}

export async function register(req: AuthedRequest, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, "Validation failed", 422, errors.array());

  const { name, email, password, phone, vehicleNumber, profilePhoto } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return fail(res, "An account with this email already exists", 409);

  const user = await User.create({ name, email, password, phone, vehicleNumber, profilePhoto });
  const token = signAuthToken({ userId: String(user._id), email: user.email });

  return created(res, { token, user: publicUser(user) }, "Driver registered successfully");
}

export async function login(req: AuthedRequest, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, "Validation failed", 422, errors.array());

  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user) return fail(res, "Invalid email or password", 401);

  const matches = await user.comparePassword(password);
  if (!matches) return fail(res, "Invalid email or password", 401);

  const token = signAuthToken({ userId: String(user._id), email: user.email });
  return ok(res, { token, user: publicUser(user) }, "Login successful");
}

export async function getProfile(req: AuthedRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return fail(res, "User not found", 404);
  return ok(res, publicUser(user));
}

export async function updateProfile(req: AuthedRequest, res: Response) {
  const { name, phone, vehicleNumber, profilePhoto } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return fail(res, "User not found", 404);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

  await user.save();
  return ok(res, publicUser(user), "Profile updated");
}

export async function registerDeviceToken(req: AuthedRequest, res: Response) {
  const { fcmToken } = req.body;
  if (!fcmToken) return fail(res, "fcmToken is required", 400);

  const user = await User.findById(req.userId);
  if (!user) return fail(res, "User not found", 404);

  if (!user.fcmTokens.includes(fcmToken)) {
    user.fcmTokens.push(fcmToken);
    await user.save();
  }
  return ok(res, { fcmTokens: user.fcmTokens }, "Device registered for push notifications");
}

export async function forgotPassword(req: AuthedRequest, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, "Validation failed", 422, errors.array());

  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always return 200 to avoid leaking which emails are registered
  if (!user) {
    return ok(res, null, "If that email is registered, a reset link has been sent");
  }

  const resetToken = signResetToken({ userId: String(user._id) });
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  if (env.SMTP_HOST && env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${resetToken}`;
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: user.email,
        subject: "Reset your Drowsiness Alert System password",
        html: `<p>Hi ${user.name},</p><p>Click below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (err) {
      console.error("[auth] Failed to send reset email:", err);
    }
  } else {
    console.log(`[auth] (dev mode, no SMTP configured) Reset token for ${email}: ${resetToken}`);
  }

  return ok(res, null, "If that email is registered, a reset link has been sent");
}

export async function resetPassword(req: AuthedRequest, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, "Validation failed", 422, errors.array());

  const { token, newPassword } = req.body;
  let payload: { userId: string };
  try {
    payload = verifyResetToken(token);
  } catch {
    return fail(res, "Reset link is invalid or has expired", 400);
  }

  const user = await User.findById(payload.userId).select("+resetPasswordExpires");
  if (!user) return fail(res, "User not found", 404);

  if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
    return fail(res, "Reset link has expired, please request a new one", 400);
  }

  user.password = newPassword;
  user.resetPasswordExpires = undefined;
  await user.save();

  return ok(res, null, "Password has been reset successfully. Please log in.");
}
