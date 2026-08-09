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

import { prisma } from "../lib/prisma";

// Verifies the Bearer token, ensures user exists in DB, and attaches to req.user.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or invalid Authorization header"));
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    // Ensure the user still exists in the database (handles case where DB was reset but token remained)
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return next(new ApiError(401, "Session invalid: User no longer exists"));
    }

    const role = normalizeRole(payload.role);
    if (!role) {
      return next(new ApiError(401, "Session invalid: Invalid role"));
    }

    req.user = { ...payload, role };
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

// Restricts a route based on shared permission matrix
export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }
    
    if (!hasPermission(req.user.role, resource, action)) {
      return next(new ApiError(403, `Forbidden: ${req.user.role} does not have ${action} permission on ${resource}`));
    }
    
    next();
  };
}
