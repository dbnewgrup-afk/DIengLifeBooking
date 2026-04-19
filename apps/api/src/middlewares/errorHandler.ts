
import { AppError } from "../lib/errors.js";
import type { Request, Response, NextFunction } from 'express';

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const body: any = { error: err.message };
    if (process.env.NODE_ENV !== "production" && err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  return res.status(500).json({ error: "Internal Server Error" });
}









