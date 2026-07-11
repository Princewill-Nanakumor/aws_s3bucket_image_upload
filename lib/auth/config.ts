const getEnv = (keys: string[], options?: { required?: boolean }) => {
  const shouldWarn = options?.required ?? true;
  let missingKeyLog = "";
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
    if (!missingKeyLog) missingKeyLog = key;
  }
  if (
    shouldWarn &&
    process.env.NODE_ENV !== "production" &&
    missingKeyLog &&
    typeof console !== "undefined"
  ) {
    console.warn(`[auth-config] Missing env: ${keys.join(" or ")}`);
  }
  return undefined;
};

/** Password required to unlock the upload UI. Set in `.env` as APP_ACCESS_PASSWORD. */
export const APP_ACCESS_PASSWORD = getEnv(["APP_ACCESS_PASSWORD"]);

/**
 * Secret used to sign session / lock cookies.
 * Falls back to the access password when AUTH_SECRET is unset.
 */
export const AUTH_SECRET =
  getEnv(["AUTH_SECRET"], { required: false }) || APP_ACCESS_PASSWORD;
