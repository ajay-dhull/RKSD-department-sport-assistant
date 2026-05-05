import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required for department authentication");
  return secret;
}

export interface DepartmentTokenPayload {
  departmentId: string;
  departmentSlug: string;
}

export function generateDepartmentToken(departmentId: string, departmentSlug: string): string {
  return jwt.sign(
    { departmentId, departmentSlug },
    getJwtSecret(),
    { expiresIn: "24h" }
  );
}

export function verifyDepartmentToken(token: string): DepartmentTokenPayload {
  return jwt.verify(token, getJwtSecret()) as DepartmentTokenPayload;
}

export function requireDepartmentAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: "Unauthorized: Department authentication required" 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = verifyDepartmentToken(token);
    (req as any).departmentAuth = payload;
    next();
  } catch (error) {
    return res.status(403).json({ 
      message: "Forbidden: Invalid or expired token" 
    });
  }
}

export function validateDepartmentAccess(req: Request, res: Response, next: NextFunction) {
  const departmentAuth = (req as any).departmentAuth as DepartmentTokenPayload;
  const requestedDepartmentId = req.params.departmentId;
  
  if (!departmentAuth) {
    return res.status(401).json({ 
      message: "Unauthorized: No authentication found" 
    });
  }

  if (requestedDepartmentId && departmentAuth.departmentId !== requestedDepartmentId) {
    return res.status(403).json({ 
      message: "Forbidden: Cannot access other department's data" 
    });
  }

  next();
}
