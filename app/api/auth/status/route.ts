import {
  applySetCookies,
  buildSetCookieHeaders,
  getRequestLockState,
  lockJson,
  resolveDeviceId,
} from "@/lib/auth/request";
import {
  isPasswordConfigured,
  isRequestAuthenticated,
} from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    if (!isPasswordConfigured()) {
      return Response.json(
        {
          authenticated: false,
          configured: false,
          error: "Access password is not configured",
          code: "AUTH_MISCONFIGURED",
        },
        { status: 503 },
      );
    }

    const { deviceId, isNew } = resolveDeviceId(req);
    const lockState = getRequestLockState(req, deviceId);
    const authenticated = isRequestAuthenticated(req);
    const lock = lockJson(lockState);

    const res = Response.json({
      configured: true,
      authenticated: authenticated && !lock.locked,
      ...lock,
    });

    return applySetCookies(
      res,
      buildSetCookieHeaders({
        deviceId,
        setDeviceCookie: isNew,
        lockState,
      }),
    );
  } catch (err) {
    console.error("Auth status failed", err);
    return Response.json({ error: "Status check failed" }, { status: 500 });
  }
}
