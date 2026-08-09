import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

// Central error handler. Every route uses asyncHandler + throws ApiError
// (or Zod validation errors), and they all land here in one consistent shape.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  // Zod validation errors
  if (err && typeof err === "object" && "issues" in (err as any)) {
    return res.status(400).json({
      error: "Validation failed",
      details: (err as any).issues,
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}
