import {
  applySetCookies,
  buildSetCookieHeaders,
  failPasswordAttempt,
  getRequestLockState,
  lockJson,
  resetPasswordAttempts,
  resolveDeviceId,
} from "@/lib/auth/request";
import {
  createSessionToken,
  isPasswordConfigured,
  verifyAccessPassword,
} from "@/lib/auth/session";
import { isLocked } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  try {
    if (!isPasswordConfigured()) {
      return Response.json(
        {
          error: "Access password is not configured",
          code: "AUTH_MISCONFIGURED",
        },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => null);
    const password =
      body && typeof body.password === "string" ? body.password : "";

    const { deviceId, isNew } = resolveDeviceId(req);
    let lockState = getRequestLockState(req, deviceId);

    if (isLocked(lockState)) {
      const res = Response.json(
        {
          error: "Too many failed attempts. Try again later.",
          code: "LOCKED",
          ...lockJson(lockState),
        },
        { status: 429 },
      );
      return applySetCookies(
        res,
        buildSetCookieHeaders({
          deviceId,
          setDeviceCookie: isNew,
          lockState,
        }),
      );
    }

    if (!password || !verifyAccessPassword(password)) {
      lockState = failPasswordAttempt(deviceId, lockState);
      const locked = isLocked(lockState);
      const res = Response.json(
        {
          error: locked
            ? "Too many failed attempts. Upload access is locked for 5 hours."
            : "Incorrect password",
          code: locked ? "LOCKED" : "INVALID_PASSWORD",
          ...lockJson(lockState),
        },
        { status: locked ? 429 : 401 },
      );
      return applySetCookies(
        res,
        buildSetCookieHeaders({
          deviceId,
          setDeviceCookie: isNew,
          lockState,
        }),
      );
    }

    lockState = resetPasswordAttempts(deviceId);
    const sessionToken = createSessionToken();
    const res = Response.json({
      ok: true,
      authenticated: true,
      ...lockJson(lockState),
    });
    return applySetCookies(
      res,
      buildSetCookieHeaders({
        deviceId,
        setDeviceCookie: isNew,
        clearLock: true,
        sessionToken,
      }),
    );
  } catch (err) {
    console.error("Login failed", err);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
