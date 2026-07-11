import {
  CLIENT_DEVICE_ID_STORAGE_KEY,
  CLIENT_LOCK_STORAGE_KEY,
  LOCK_DURATION_MS,
  MAX_PASSWORD_ATTEMPTS,
} from "@/lib/auth/constants";

export type ClientLockState = {
  attempts: number;
  lockedUntil: number | null;
};

const emptyState = (): ClientLockState => ({ attempts: 0, lockedUntil: null });

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const getOrCreateClientDeviceId = () => {
  if (!canUseStorage()) return "";
  const existing = window.localStorage.getItem(CLIENT_DEVICE_ID_STORAGE_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(CLIENT_DEVICE_ID_STORAGE_KEY, id);
  return id;
};

const normalize = (state: ClientLockState | null): ClientLockState => {
  if (!state) return emptyState();
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    return emptyState();
  }
  return {
    attempts: Math.max(0, Math.floor(state.attempts || 0)),
    lockedUntil:
      typeof state.lockedUntil === "number" && state.lockedUntil > Date.now()
        ? state.lockedUntil
        : null,
  };
};

export const readClientLockState = (): ClientLockState => {
  if (!canUseStorage()) return emptyState();
  try {
    const raw = window.localStorage.getItem(CLIENT_LOCK_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ClientLockState;
    const normalized = normalize(parsed);
    if (!normalized.attempts && !normalized.lockedUntil) {
      window.localStorage.removeItem(CLIENT_LOCK_STORAGE_KEY);
    } else {
      window.localStorage.setItem(
        CLIENT_LOCK_STORAGE_KEY,
        JSON.stringify(normalized),
      );
    }
    return normalized;
  } catch {
    return emptyState();
  }
};

export const writeClientLockState = (state: ClientLockState) => {
  if (!canUseStorage()) return normalize(state);
  const normalized = normalize(state);
  if (!normalized.attempts && !normalized.lockedUntil) {
    window.localStorage.removeItem(CLIENT_LOCK_STORAGE_KEY);
    return normalized;
  }
  window.localStorage.setItem(
    CLIENT_LOCK_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  return normalized;
};

export const clearClientLockState = () => writeClientLockState(emptyState());

export const isClientLocked = (state: ClientLockState = readClientLockState()) =>
  typeof state.lockedUntil === "number" && state.lockedUntil > Date.now();

export const clientAttemptsRemaining = (
  state: ClientLockState = readClientLockState(),
) => {
  if (isClientLocked(state)) return 0;
  return Math.max(0, MAX_PASSWORD_ATTEMPTS - state.attempts);
};

/** Apply a failed attempt locally before/after talking to the server. */
export const recordClientFailedAttempt = (
  state: ClientLockState = readClientLockState(),
) => {
  const current = normalize(state);
  if (isClientLocked(current)) return writeClientLockState(current);

  const attempts = current.attempts + 1;
  if (attempts >= MAX_PASSWORD_ATTEMPTS) {
    return writeClientLockState({
      attempts: MAX_PASSWORD_ATTEMPTS,
      lockedUntil: Date.now() + LOCK_DURATION_MS,
    });
  }
  return writeClientLockState({ attempts, lockedUntil: null });
};

/**
 * Merge server lock status into localStorage so both sides stay aligned.
 * Takes the stricter of the two (higher attempts / later lock).
 */
export const syncClientLockFromServer = (server: {
  attempts?: number;
  lockedUntil?: number | null;
  locked?: boolean;
}) => {
  const local = readClientLockState();
  const serverAttempts =
    typeof server.attempts === "number" ? server.attempts : 0;
  const serverLockedUntil =
    typeof server.lockedUntil === "number" && server.lockedUntil > Date.now()
      ? server.lockedUntil
      : null;

  const attempts = Math.max(local.attempts, serverAttempts);
  const lockedUntil =
    Math.max(local.lockedUntil || 0, serverLockedUntil || 0) || null;

  if (lockedUntil && lockedUntil > Date.now()) {
    return writeClientLockState({
      attempts: Math.max(attempts, MAX_PASSWORD_ATTEMPTS),
      lockedUntil,
    });
  }

  return writeClientLockState({ attempts, lockedUntil: null });
};

export const formatLockRemaining = (lockedUntil: number) => {
  const ms = Math.max(0, lockedUntil - Date.now());
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};
