import {
  isPasswordConfigured,
  isRequestAuthenticated,
} from "@/lib/auth/session";

export const unauthorizedResponse = () =>
  Response.json(
    { error: "Unauthorized", code: "AUTH_REQUIRED" },
    { status: 401 },
  );

export const misconfiguredAuthResponse = () =>
  Response.json(
    {
      error: "Access password is not configured",
      code: "AUTH_MISCONFIGURED",
    },
    { status: 503 },
  );

/** Rejects the request unless a valid access session cookie is present. */
export const requireAuth = (req: Request): Response | null => {
  if (!isPasswordConfigured()) {
    return misconfiguredAuthResponse();
  }
  if (!isRequestAuthenticated(req)) {
    return unauthorizedResponse();
  }
  return null;
};
