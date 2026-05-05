import { Request, Response, NextFunction } from "express";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: "Unauthorized: Admin authentication required" 
    });
  }

  const token = authHeader.substring(7);
  
  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ 
      message: "Forbidden: Invalid admin credentials" 
    });
  }

  next();
}

export function loginAdmin(req: Request, res: Response) {
  const { password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      message: "Invalid admin password" 
    });
  }

  res.json({ 
    success: true, 
    token: ADMIN_PASSWORD,
    message: "Admin login successful" 
  });
}
