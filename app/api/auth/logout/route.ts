import {
  applySetCookies,
  buildSetCookieHeaders,
  resolveDeviceId,
} from "@/lib/auth/request";

export async function POST(req: Request) {
  const { deviceId, isNew } = resolveDeviceId(req);
  const res = Response.json({ ok: true, authenticated: false });
  return applySetCookies(
    res,
    buildSetCookieHeaders({
      deviceId,
      setDeviceCookie: isNew,
      clearSession: true,
    }),
  );
}
