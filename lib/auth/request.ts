import {
  DEVICE_ID_COOKIE,
  DEVICE_ID_HEADER,
  LOCK_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/constants";
import {
  deviceIdCookieHeader,
  getCookieValue,
  lockCookieHeader,
  sessionCookieHeader,
  clearCookie,
} from "@/lib/auth/cookies";
import { createDeviceId } from "@/lib/auth/crypto";
import {
  clearLockState,
  lockStatusPayload,
  recordFailedAttempt,
  resolveLockState,
  setMemoryLock,
  writeLockToken,
  type LockState,
} from "@/lib/auth/rate-limit";

export const resolveDeviceId = (req: Request) => {
  const headerId = req.headers.get(DEVICE_ID_HEADER)?.trim();
  const cookieId = getCookieValue(req.headers.get("cookie"), DEVICE_ID_COOKIE);
  const deviceId = headerId || cookieId || createDeviceId();
  const isNew = !headerId && !cookieId;
  return { deviceId, isNew };
};

export const buildSetCookieHeaders = (options: {
  deviceId: string;
  setDeviceCookie?: boolean;
  lockState?: LockState | null;
  clearLock?: boolean;
  sessionToken?: string | null;
  clearSession?: boolean;
}) => {
  const headers: string[] = [];

  if (options.setDeviceCookie) {
    headers.push(deviceIdCookieHeader(options.deviceId));
  }

  if (options.clearLock) {
    headers.push(clearCookie(LOCK_COOKIE));
  } else if (options.lockState) {
    headers.push(lockCookieHeader(writeLockToken(options.lockState)));
  }

  if (options.clearSession) {
    headers.push(clearCookie(SESSION_COOKIE));
  } else if (options.sessionToken) {
    headers.push(sessionCookieHeader(options.sessionToken));
  }

  return headers;
};

export const applySetCookies = (res: Response, cookies: string[]) => {
  for (const cookie of cookies) {
    res.headers.append("Set-Cookie", cookie);
  }
  return res;
};

export const getRequestLockState = (req: Request, deviceId: string) => {
  const lockToken = getCookieValue(req.headers.get("cookie"), LOCK_COOKIE);
  return resolveLockState(deviceId, lockToken);
};

export const failPasswordAttempt = (deviceId: string, current: LockState) => {
  const next = recordFailedAttempt(current);
  setMemoryLock(deviceId, next);
  return next;
};

export const resetPasswordAttempts = (deviceId: string) => {
  const cleared = clearLockState();
  setMemoryLock(deviceId, cleared);
  return cleared;
};

export const lockJson = (state: LockState) => lockStatusPayload(state);
