import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { fail } from "../utils/apiResponse";

/**
 * Guards machine-to-machine endpoints (the Python AI service posting alerts).
 * The AI service sends a shared secret in the x-api-key header.
 */
export function requireServiceKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-api-key"];
  if (key !== env.AI_SERVICE_API_KEY) {
    return fail(res, "Invalid or missing service API key", 401);
  }
  next();
}
