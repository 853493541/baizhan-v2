import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET");
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        uid: string;
        username: string;
      };
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      uid: string;
      username: string;
    };

    req.auth = {
      uid: payload.uid,
      username: payload.username,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
