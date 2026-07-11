import {
  LOCK_DURATION_MS,
  MAX_PASSWORD_ATTEMPTS,
} from "@/lib/auth/constants";
import { createSignedToken, verifySignedToken } from "@/lib/auth/crypto";

export type LockState = {
  attempts: number;
  lockedUntil: number | null;
};

type MemoryEntry = LockState & { updatedAt: number };

const globalForAuth = globalThis as typeof globalThis & {
  __s3AuthLockStore?: Map<string, MemoryEntry>;
};

const lockStore =
  globalForAuth.__s3AuthLockStore ??
  (globalForAuth.__s3AuthLockStore = new Map<string, MemoryEntry>());

const emptyState = (): LockState => ({ attempts: 0, lockedUntil: null });

const normalizeState = (state: LockState | null | undefined): LockState => {
  if (!state) return emptyState();
  const lockedUntil =
    typeof state.lockedUntil === "number" && state.lockedUntil > Date.now()
      ? state.lockedUntil
      : null;
  const attempts =
    lockedUntil || (typeof state.attempts === "number" && state.attempts > 0)
      ? Math.max(0, Math.floor(state.attempts || 0))
      : 0;

  // Expired lock clears attempts so the device can try again.
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    return emptyState();
  }

  return { attempts, lockedUntil };
};

const mergeStates = (a: LockState, b: LockState): LockState => {
  const left = normalizeState(a);
  const right = normalizeState(b);
  const lockedUntil = Math.max(left.lockedUntil || 0, right.lockedUntil || 0) || null;
  const attempts = Math.max(left.attempts, right.attempts);
  if (lockedUntil && lockedUntil > Date.now()) {
    return {
      attempts: Math.max(attempts, MAX_PASSWORD_ATTEMPTS),
      lockedUntil,
    };
  }
  return { attempts, lockedUntil: null };
};

export const readLockToken = (token: string | undefined | null): LockState => {
  if (!token) return emptyState();
  const parsed = verifySignedToken<LockState>(token);
  return normalizeState(parsed);
};

export const writeLockToken = (state: LockState) =>
  createSignedToken(normalizeState(state));

export const getMemoryLock = (deviceId: string): LockState => {
  const entry = lockStore.get(deviceId);
  if (!entry) return emptyState();
  const normalized = normalizeState(entry);
  if (!normalized.attempts && !normalized.lockedUntil) {
    lockStore.delete(deviceId);
  } else {
    lockStore.set(deviceId, { ...normalized, updatedAt: Date.now() });
  }
  return normalized;
};

export const setMemoryLock = (deviceId: string, state: LockState) => {
  const normalized = normalizeState(state);
  if (!normalized.attempts && !normalized.lockedUntil) {
    lockStore.delete(deviceId);
    return normalized;
  }
  lockStore.set(deviceId, { ...normalized, updatedAt: Date.now() });
  return normalized;
};

export const resolveLockState = (
  deviceId: string,
  lockCookieToken: string | undefined | null,
): LockState => {
  const fromCookie = readLockToken(lockCookieToken);
  const fromMemory = getMemoryLock(deviceId);
  const merged = mergeStates(fromCookie, fromMemory);
  setMemoryLock(deviceId, merged);
  return merged;
};

export const isLocked = (state: LockState) =>
  typeof state.lockedUntil === "number" && state.lockedUntil > Date.now();

export const attemptsRemaining = (state: LockState) => {
  if (isLocked(state)) return 0;
  return Math.max(0, MAX_PASSWORD_ATTEMPTS - state.attempts);
};

export const recordFailedAttempt = (state: LockState): LockState => {
  const current = normalizeState(state);
  if (isLocked(current)) return current;

  const attempts = current.attempts + 1;
  if (attempts >= MAX_PASSWORD_ATTEMPTS) {
    return {
      attempts: MAX_PASSWORD_ATTEMPTS,
      lockedUntil: Date.now() + LOCK_DURATION_MS,
    };
  }
  return { attempts, lockedUntil: null };
};

export const clearLockState = (): LockState => emptyState();

export const lockStatusPayload = (state: LockState) => {
  const normalized = normalizeState(state);
  const locked = isLocked(normalized);
  return {
    locked,
    lockedUntil: locked ? normalized.lockedUntil : null,
    attempts: normalized.attempts,
    attemptsRemaining: attemptsRemaining(normalized),
    maxAttempts: MAX_PASSWORD_ATTEMPTS,
    lockDurationMs: LOCK_DURATION_MS,
  };
};
