import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { AUTH_SECRET } from "@/lib/auth/config";

const getSigningSecret = () => {
  if (!AUTH_SECRET) {
    throw new Error("Missing APP_ACCESS_PASSWORD (or AUTH_SECRET) configuration");
  }
  return AUTH_SECRET;
};

export const toBase64Url = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");

export const fromBase64Url = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");

export const signPayload = (payload: string) =>
  createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");

export const createSignedToken = (data: unknown) => {
  const payload = toBase64Url(JSON.stringify(data));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
};

export const verifySignedToken = <T>(token: string): T | null => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const givenBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (givenBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(givenBuf, expectedBuf)) return null;

  try {
    return JSON.parse(fromBase64Url(payload)) as T;
  } catch {
    return null;
  }
};

export const safeEqualString = (a: string, b: string) => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still run a compare to reduce timing leaks on length mismatch.
    timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
};

export const createDeviceId = () => randomUUID();
