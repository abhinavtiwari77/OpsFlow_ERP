import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";

export type JwtPayload = {
  userId: string;
  role: "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
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
    req.user = payload;
    next();
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }
}

// Restricts a route to a specific set of roles. Use after requireAuth.
export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `This action requires one of the following roles: ${roles.join(", ")}`);
    }
    next();
  };
}
