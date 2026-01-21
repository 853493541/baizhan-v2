import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  // Fail fast: auth must never run with a missing secret
  throw new Error("Missing JWT_SECRET in environment variables.");
}

export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365; // 365 days

/**
 * ✅ APPLICATION JWT PAYLOAD
 * tokenVersion is REQUIRED to support global logout
 */
export type AppJwtPayload = {
  uid: string;
  username: string;
  tokenVersion: number;
};

/* =========================
   PASSWORD HELPERS
========================= */

export async function hashPassword(plain: string) {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/* =========================
   JWT HELPERS
========================= */

export function signToken(payload: AppJwtPayload) {
  // 1-year token lifetime
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ONE_YEAR_SECONDS,
  });
}

export function verifyToken(token: string): AppJwtPayload {
  return jwt.verify(token, JWT_SECRET) as AppJwtPayload;
}

/* =========================
   COOKIE OPTIONS
========================= */

export function getCookieOptions(req: Request) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd, // must be true in production (HTTPS)
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR_SECONDS * 1000, // milliseconds
  };
}

/* =========================
   IP HELPER (NEW)
========================= */

/**
 * Safely extract client IP
 * - Works behind nginx / proxy / cloud LB
 * - Returns single IP (no list)
 */
export function getClientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }

  return req.socket?.remoteAddress || null;
}
