/** Shared auth / rate-limit constants used by server and client. */

export const MAX_PASSWORD_ATTEMPTS = 2;
export const LOCK_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const DEVICE_ID_COOKIE = "s3_device_id";
export const LOCK_COOKIE = "s3_auth_lock";
export const SESSION_COOKIE = "s3_access_session";
export const DEVICE_ID_HEADER = "x-device-id";

export const CLIENT_LOCK_STORAGE_KEY = "s3_auth_lock_state";
export const CLIENT_DEVICE_ID_STORAGE_KEY = "s3_device_id";
