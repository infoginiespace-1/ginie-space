import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, BusinessType } from "@giniespace/sheets-db";

export interface AuthenticatedUser {
  id: string;
  actorId?: string;
  email: string;
  role: UserRole;
  businessType: BusinessType;
  name: string;
  plan?: "free" | "pro";
  staffPermissions?: string[];
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

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "You do not have permission to perform this action" });
    return;
  }
  next();
}

export function requireOwnerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role === "staff") {
    res.status(403).json({ error: "Only the business owner can modify this setting or remove records" });
    return;
  }
  next();
}

export function requireStaffArea(area: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Please log in to continue" });
      return;
    }
    if (req.user.role === "admin" || req.user.role === "user") {
      next();
      return;
    }
    const perms = req.user.staffPermissions || [];
    if (!perms.includes(area)) {
      res.status(403).json({ error: `Staff account does not have access to ${area}` });
      return;
    }
    next();
  };
}