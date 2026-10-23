import { Request, Response, NextFunction } from "express";
import { verifyAuthToken } from "../utils/jwt";
import { fail } from "../utils/apiResponse";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return fail(res, "Missing or malformed Authorization header", 401);
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAuthToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    next();
  } catch {
    return fail(res, "Invalid or expired token", 401);
  }
}
