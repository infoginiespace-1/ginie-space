import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, BusinessType } from "@giniespace/sheets-db";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  businessType: BusinessType;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Please log in to continue" });
      return;
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Session expired or invalid. Please log in again" });
    }
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "You do not have permission to perform this action" });
    return;
  }
  next();
}