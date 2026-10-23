import { Request, Response, NextFunction } from "express";
import { fail } from "../utils/apiResponse";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error("[error]", err);
  if (err instanceof ApiError) {
    return fail(res, err.message, err.status);
  }
  if (err instanceof Error) {
    return fail(res, err.message, 500);
  }
  return fail(res, "Internal server error", 500);
}
