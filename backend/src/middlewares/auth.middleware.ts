import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export interface AuthPayload {
  id: number;
  role: 'USER' | 'ADMIN';
}

// Extend Express Request to carry decoded JWT
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
//
// ── Require any authenticated user ──────────────────────────────────────────
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ msg: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ msg: 'Unauthorized: Token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ msg: 'Unauthorized: Invalid or expired token' });
  }
};

// ── Require ADMIN role ───────────────────────────────────────────────────────
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ msg: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ msg: 'Forbidden: Admins only' });
    return;
  }
  next();
};
