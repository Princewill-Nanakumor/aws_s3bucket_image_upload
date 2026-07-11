import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { APP_ACCESS_PASSWORD } from "@/lib/auth/config";
import {
  createSignedToken,
  safeEqualString,
  verifySignedToken,
} from "@/lib/auth/crypto";
import { getCookieValue, SESSION_COOKIE } from "@/lib/auth/cookies";

type SessionPayload = {
  v: 1;
  exp: number;
};

export const isPasswordConfigured = () => Boolean(APP_ACCESS_PASSWORD);

export const verifyAccessPassword = (password: string) => {
  if (!APP_ACCESS_PASSWORD) return false;
  return safeEqualString(password, APP_ACCESS_PASSWORD);
};

export const createSessionToken = () => {
  const payload: SessionPayload = {
    v: 1,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  return createSignedToken(payload);
};

export const verifySessionToken = (token: string | undefined | null) => {
  if (!token) return false;
  const payload = verifySignedToken<SessionPayload>(token);
  if (!payload || payload.v !== 1) return false;
  if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return false;
  return true;
};

export const isRequestAuthenticated = (req: Request) => {
  const token = getCookieValue(req.headers.get("cookie"), SESSION_COOKIE);
  return verifySessionToken(token);
};
