import { Response } from "express";

export function ok(res: Response, data: unknown, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created(res: Response, data: unknown, message = "Created") {
  return ok(res, data, message, 201);
}

export function fail(res: Response, message: string, status = 400, errors?: unknown) {
  return res.status(status).json({ success: false, message, errors });
}
