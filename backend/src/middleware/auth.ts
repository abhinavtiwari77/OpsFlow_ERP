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

// Verifies the Bearer token and attaches the decoded user to req.user.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const role = normalizeRole(payload.role);
    if (!role) throw new Error("Invalid role");
    req.user = { ...payload, role };
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}

// Restricts a route based on shared permission matrix
export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    
    if (!hasPermission(req.user.role, resource, action)) {
      throw new ApiError(403, `Forbidden: ${req.user.role} does not have ${action} permission on ${resource}`);
    }
    
    next();
  };
}
