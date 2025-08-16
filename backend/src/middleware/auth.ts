import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: number; email: string; username: string };
}

export function auth(required = true) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      if (!required) return next();
      return res.status(401).json({ success: false, error: "Missing token" });
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      req.user = { id: payload.id, email: payload.email, username: payload.username };
      next();
    } catch {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
  };
}
