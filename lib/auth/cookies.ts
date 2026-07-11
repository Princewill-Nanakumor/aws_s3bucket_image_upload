import {
  DEVICE_ID_COOKIE,
  LOCK_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  LOCK_DURATION_MS,
} from "@/lib/auth/constants";

type CookieOptions = {
  maxAgeSeconds: number;
  httpOnly?: boolean;
};

const isProduction = process.env.NODE_ENV === "production";

export const serializeCookie = (
  name: string,
  value: string,
  options: CookieOptions,
) => {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`,
  ];
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
};

export const clearCookie = (name: string) =>
  serializeCookie(name, "", { maxAgeSeconds: 0 });

export const parseCookies = (cookieHeader: string | null) => {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      map.set(key, decodeURIComponent(value));
    } catch {
      map.set(key, value);
    }
  }
  return map;
};

export const getCookieValue = (
  cookieHeader: string | null,
  name: string,
) => parseCookies(cookieHeader).get(name);

export const sessionCookieHeader = (token: string) =>
  serializeCookie(SESSION_COOKIE, token, {
    maxAgeSeconds: SESSION_MAX_AGE_SECONDS,
  });

export const lockCookieHeader = (token: string) =>
  serializeCookie(LOCK_COOKIE, token, {
    // Keep lock cookie at least as long as a full lock window.
    maxAgeSeconds: Math.ceil(LOCK_DURATION_MS / 1000) + 60,
  });

export const deviceIdCookieHeader = (deviceId: string) =>
  serializeCookie(DEVICE_ID_COOKIE, deviceId, {
    maxAgeSeconds: 60 * 60 * 24 * 365,
  });

export const clearAuthCookies = () => [
  clearCookie(SESSION_COOKIE),
  clearCookie(LOCK_COOKIE),
];

export {
  DEVICE_ID_COOKIE,
  LOCK_COOKIE,
  SESSION_COOKIE,
};
