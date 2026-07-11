"use client";

import { FormEvent, useEffect, useState } from "react";
import { DEVICE_ID_HEADER } from "@/lib/auth/constants";
import {
  clearClientLockState,
  formatLockRemaining,
  getOrCreateClientDeviceId,
  isClientLocked,
  readClientLockState,
  recordClientFailedAttempt,
  syncClientLockFromServer,
} from "@/lib/auth/client-lock";

type PasswordGateProps = {
  onAuthenticated: () => void;
};

type AuthStatus = {
  authenticated?: boolean;
  locked?: boolean;
  lockedUntil?: number | null;
  attempts?: number;
  error?: string;
  code?: string;
};

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const locked = typeof lockedUntil === "number" && lockedUntil > now;

  useEffect(() => {
    if (!lockedUntil || lockedUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [lockedUntil]);

  useEffect(() => {
    const local = readClientLockState();
    if (isClientLocked(local) && local.lockedUntil) {
      setLockedUntil(local.lockedUntil);
    }

    const deviceId = getOrCreateClientDeviceId();

    const syncStatus = async () => {
      try {
        const res = await fetch("/api/auth/status", {
          headers: { [DEVICE_ID_HEADER]: deviceId },
          credentials: "include",
        });
        const data = (await res.json()) as AuthStatus;

        const synced = syncClientLockFromServer({
          attempts: data.attempts,
          lockedUntil: data.lockedUntil,
          locked: data.locked,
        });

        if (synced.lockedUntil && synced.lockedUntil > Date.now()) {
          setLockedUntil(synced.lockedUntil);
        } else {
          setLockedUntil(null);
        }

        if (res.ok && data.authenticated && !data.locked) {
          clearClientLockState();
          onAuthenticated();
          return;
        }

        if (data.code === "AUTH_MISCONFIGURED") {
          setError(
            "Server password is not configured. Set APP_ACCESS_PASSWORD.",
          );
        }
      } catch {
        // Keep local lock state if status check fails.
      } finally {
        setChecking(false);
      }
    };

    syncStatus();
  }, [onAuthenticated]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const local = readClientLockState();
    if (isClientLocked(local) && local.lockedUntil) {
      setLockedUntil(local.lockedUntil);
      setError("Too many failed attempts. Try again after the lock expires.");
      return;
    }

    setLoading(true);
    setError("");

    const deviceId = getOrCreateClientDeviceId();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [DEVICE_ID_HEADER]: deviceId,
        },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json()) as AuthStatus & { ok?: boolean };

      if (!res.ok) {
        if (data.code === "INVALID_PASSWORD" || data.code === "LOCKED") {
          if (typeof data.attempts !== "number") {
            recordClientFailedAttempt();
          }
        }

        const synced = syncClientLockFromServer({
          attempts: data.attempts,
          lockedUntil: data.lockedUntil,
          locked: data.locked,
        });

        if (synced.lockedUntil && synced.lockedUntil > Date.now()) {
          setLockedUntil(synced.lockedUntil);
        } else {
          setLockedUntil(null);
        }

        setError(
          data.error ||
            (synced.lockedUntil
              ? "Too many failed attempts. Upload access is locked for 5 hours."
              : "Incorrect password"),
        );
        setPassword("");
        return;
      }

      clearClientLockState();
      setLockedUntil(null);
      setPassword("");
      onAuthenticated();
    } catch {
      setError("Could not verify password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <h1 className="font-display text-3xl font-semibold mb-6 text-center text-slate-800">
        Enter Access Password to upload images
      </h1>

      {checking ? (
        <p className="text-center text-slate-500 text-sm">Checking access…</p>
      ) : locked ? (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-5 text-center">
          <p className="text-rose-700 font-medium">Device locked</p>
          <p className="text-rose-600 text-sm mt-2">
            Too many incorrect passwords. Try again in{" "}
            <span className="font-semibold">
              {formatLockRemaining(lockedUntil!)}
            </span>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={loading}
              className="w-full rounded-xl border border-indigo-200 bg-white/90 px-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-linear-to-r from-slate-900 to-slate-700 text-white py-2.5 rounded-xl hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md transition"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-4 text-center text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
