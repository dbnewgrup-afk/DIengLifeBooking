// apps/web-admin/src/store/session.ts
// Store ringan untuk info user (name/email/role) sinkron dengan token.

"use client";

import { useEffect, useSyncExternalStore, useMemo } from "react";
import { getProfile, getRole, getToken, onAuthChange } from "../lib/auth/session";
import type { Role } from "../lib/api/schemas";

type UserLite = { name?: string; email?: string; role?: Role };

type SessionState = {
  user?: UserLite;
  token?: string | null;
};

let state: SessionState = {
  user: getProfile(),
  token: getToken(),
};

const subs = new Set<() => void>();

function emit() {
  for (const cb of Array.from(subs)) cb();
}

function getSnapshot(): SessionState {
  return state;
}

function subscribe(cb: () => void) {
  subs.add(cb);
  return () => subs.delete(cb);
}

// Public API
export function setUser(user?: UserLite) {
  state = { ...state, user };
  emit();
}

export function clear() {
  state = { user: undefined, token: null };
  emit();
}

export function refreshFromToken() {
  state = {
    token: getToken(),
    user: getProfile(),
  };
  emit();
}

/**
 * Hook utama untuk membaca session user pada client.
 * Mengekspos helper minimal untuk sinkronisasi.
 */
export function useSession() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Auto-sync dengan perubahan token global
  useEffect(() => {
    const off = onAuthChange(() => {
      state = {
        token: getToken(),
        user: getProfile(),
      };
      emit();
    });
    return off;
  }, []);

  const role = useMemo<Role | undefined>(() => {
    // role dari profile jika ada, fallback decode langsung
    return snap.user?.role ?? getRole();
  }, [snap.user?.role]);

  return {
    user: snap.user,
    token: snap.token,
    role,
    // Helpers
    setUser,
    clear,
    refreshFromToken,
  };
}
