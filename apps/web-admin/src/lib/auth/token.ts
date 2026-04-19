import type { Role } from "@/lib/api/schemas";
import { normalizeRole } from "./role-routing";

type AuthTokenPayload = {
  id?: string;
  email?: string;
  name?: string;
  role?: Role;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4 || 4)) % 4), "=");

    if (typeof atob === "function") {
      return decodeURIComponent(
        atob(padded)
          .split("")
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join("")
      );
    }

    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function decodeAuthTokenPayload(token?: string | null): AuthTokenPayload | undefined {
  if (!token) return undefined;

  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  const decoded = decodeBase64Url(parts[1]);
  if (!decoded) return undefined;

  try {
    return JSON.parse(decoded) as AuthTokenPayload;
  } catch {
    return undefined;
  }
}

export function decodeAuthRole(token?: string | null): Role | undefined {
  return normalizeRole(decodeAuthTokenPayload(token)?.role);
}
