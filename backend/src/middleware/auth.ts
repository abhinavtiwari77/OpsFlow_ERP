import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { hasPermission, normalizeRole, Resource, Action, Role } from "../../../shared/permissions";

export type JwtPayload = {
  userId: string;
  role: Role;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Verifies the Bearer JWT and attaches the decoded payload to req.user.
// NOTE: We intentionally do NOT do a DB lookup here. The JWT is cryptographically
// signed with JWT_SECRET. If the secret is kept safe, a valid JWT guarantees the
// user existed at login time. Adding a DB lookup on every request would double
// the latency of every API call on the Supabase connection pool.
//
// If a user needs to be revoked before their token expires (8h), the correct
// solution is to use short-lived tokens + refresh tokens — not a DB lookup per request.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid Authorization header"));
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    const role = normalizeRole(payload.role);
    if (!role) {
      return next(new ApiError(401, "Session invalid: Unrecognized role in token"));
    }

    req.user = { ...payload, role };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

// Restricts a route based on the shared permission matrix.
// This is a pure in-memory check — no DB query.
export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }

    if (!hasPermission(req.user.role, resource, action)) {
      return next(new ApiError(403, `Forbidden: ${req.user.role} cannot ${action} on ${resource}`));
    }

    next();
  };
}

// Re-export for use in stats.controller.ts and elsewhere
export { hasPermission };
