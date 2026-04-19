// apps/web-admin/src/lib/auth/session.ts
// Client-side session utilities: token storage + role read.

"use client";

import { SESSION_KEY } from "@/lib/constants";
import type { Role } from "@/lib/api/schemas";
import {
  AUTH_ROLE_STORAGE_KEY,
  LEGACY_ROLE_STORAGE_KEY,
  LEGACY_TOKEN_STORAGE_KEY,
  normalizeRole,
} from "./role-routing";
import { decodeAuthRole, decodeAuthTokenPayload } from "./token";

// Listener pool agar store lain bisa sync saat token berubah
const listeners = new Set<() => void>();

function safeWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

function readStorage(): string | null {
  const w = safeWindow();
  if (!w) return null;
  try {
    // Prefer localStorage, fallback sessionStorage
    return (
      w.localStorage.getItem(SESSION_KEY) ??
      w.sessionStorage.getItem(SESSION_KEY) ??
      w.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY) ??
      w.sessionStorage.getItem(LEGACY_TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function writeStorage(token: string, persist: boolean) {
  const w = safeWindow();
  if (!w) return;
  try {
    // Bersihkan keduanya dulu biar gak double
    w.localStorage.removeItem(SESSION_KEY);
    w.sessionStorage.removeItem(SESSION_KEY);
    w.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    w.sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    if (persist) {
      w.localStorage.setItem(SESSION_KEY, token);
      w.localStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, token);
    } else {
      w.sessionStorage.setItem(SESSION_KEY, token);
      w.sessionStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, token);
    }
  } catch {
    // ignore
  }
}

function clearStorage() {
  const w = safeWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(SESSION_KEY);
    w.sessionStorage.removeItem(SESSION_KEY);
    w.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
    w.sessionStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function readRoleStorage(): Role | undefined {
  const w = safeWindow();
  if (!w) return undefined;

  try {
    return normalizeRole(
      w.localStorage.getItem(AUTH_ROLE_STORAGE_KEY) ??
        w.sessionStorage.getItem(AUTH_ROLE_STORAGE_KEY) ??
        w.localStorage.getItem(LEGACY_ROLE_STORAGE_KEY) ??
        w.sessionStorage.getItem(LEGACY_ROLE_STORAGE_KEY)
    );
  } catch {
    return undefined;
  }
}

function writeRoleStorage(role: Role, persist: boolean) {
  const w = safeWindow();
  if (!w) return;

  try {
    w.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    w.sessionStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    w.localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
    w.sessionStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);

    if (persist) {
      w.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
      w.localStorage.setItem(LEGACY_ROLE_STORAGE_KEY, role);
    } else {
      w.sessionStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
      w.sessionStorage.setItem(LEGACY_ROLE_STORAGE_KEY, role);
    }
  } catch {
    // ignore
  }
}

function clearRoleStorage() {
  const w = safeWindow();
  if (!w) return;

  try {
    w.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    w.sessionStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    w.localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
    w.sessionStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return readStorage();
}

/**
 * Simpan token.
 * @param token JWT atau opaque token
 * @param persist true = localStorage, false = sessionStorage
 */
export function setToken(token: string, persist = true): void {
  writeStorage(token, persist);
  emitAuthChange();
}

export function setSession(token: string, role?: Role, persist = true): void {
  writeStorage(token, persist);
  if (role) {
    writeRoleStorage(role, persist);
  }
  emitAuthChange();
}

export function clearToken(): void {
  clearStorage();
  clearRoleStorage();
  emitAuthChange();
}

/**
 * Best-effort decode role dari payload JWT.
 * Jika bukan JWT atau tidak ada "role", akan mengembalikan undefined.
 */
export function getRole(): Role | undefined {
  return readRoleStorage() ?? decodeAuthRole(getToken());
}

/**
 * Optional helper: parse profil ringan jika ada di payload JWT.
 */
export function getProfile():
  | { name?: string; email?: string; role?: Role }
  | undefined {
  const payload = decodeAuthTokenPayload(getToken());
  if (!payload) return undefined;

  return {
    name: typeof payload.name === "string" ? payload.name : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    role: getRole(),
  };
}

// ——— Auth change pub/sub ———
function emitAuthChange() {
  for (const cb of Array.from(listeners)) {
    try {
      cb();
    } catch {
      // ignore listener errors
    }
  }
}

/**
 * Berlangganan perubahan auth (setToken/clearToken).
 * Return function untuk unsubscribe.
 */
export function onAuthChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
