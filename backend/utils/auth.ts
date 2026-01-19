import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) {
  // Fail fast: auth must never run with a missing secret
  throw new Error("Missing JWT_SECRET in environment variables.");
}

export const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365; // 365 days

export type JwtPayload = {
  uid: string;
  username: string;
};

export async function hashPassword(plain: string) {
  const saltRounds = 12;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(payload: JwtPayload) {
  // 1-year token lifetime
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ONE_YEAR_SECONDS });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// Since you are on SAME DOMAIN, cookie handling is simple:
export function getCookieOptions(req: Request) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,          // must be true in production https
    sameSite: "lax" as const,
    path: "/",
    maxAge: ONE_YEAR_SECONDS * 1000, // ms
  };
}
