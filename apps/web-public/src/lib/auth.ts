function normalizeUrl(value?: string) {
  return value?.replace(/\/+$/, "") ?? "";
}

function withApiPrefix(baseUrl: string) {
  if (!baseUrl) return "";
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export const PUBLIC_SESSION_KEY = "bv_public_token";
export const PUBLIC_ROLE_KEY = "bv_public_role";
export const PUBLIC_REFRESH_KEY = "bv_public_refresh_token";
export const API_BASE_URL =
  withApiPrefix(normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE));
export const ADMIN_APP_URL =
  normalizeUrl(process.env.NEXT_PUBLIC_ADMIN_APP_URL);

type PublicSessionUser = {
  id: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
};

type PublicMeResult = {
  ok: boolean;
  status: number;
  user?: PublicSessionUser;
  message?: string;
};

export type ResolvedPublicSession = {
  token: string;
  role: string;
  user: PublicSessionUser;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

function getStorageItem(key: string) {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage issues
  }
}

function removeStorageItem(key: string) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage issues
  }
}

async function syncPublicCookie(token: string) {
  const res = await fetch("/api/auth/set-cookie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gagal menyimpan sesi: ${res.status} ${text}`);
  }
}

async function fetchPublicMe(token: string): Promise<PublicMeResult> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      user: json?.user,
      message: json?.message || json?.error,
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Gagal memverifikasi sesi buyer.");
  }
}

export function getPublicToken() {
  return getStorageItem(PUBLIC_SESSION_KEY);
}

export function getPublicRole() {
  return getStorageItem(PUBLIC_ROLE_KEY);
}

export function getPublicRefreshToken() {
  return getStorageItem(PUBLIC_REFRESH_KEY);
}

export async function persistPublicSession(token: string, role: string, refreshToken?: string | null) {
  setStorageItem(PUBLIC_SESSION_KEY, token);
  setStorageItem(PUBLIC_ROLE_KEY, role);

  if (refreshToken) {
    setStorageItem(PUBLIC_REFRESH_KEY, refreshToken);
  } else {
    removeStorageItem(PUBLIC_REFRESH_KEY);
  }

  await syncPublicCookie(token);
}

export async function refreshPublicSession() {
  const refreshToken = getPublicRefreshToken();
  const currentRole = getPublicRole();

  if (!refreshToken) {
    return null;
  }

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json().catch(() => ({}));
  const nextToken = typeof json?.accessToken === "string" ? json.accessToken : "";

  if (!res.ok || !nextToken) {
    return null;
  }

  await persistPublicSession(nextToken, currentRole || "USER", refreshToken);
  return nextToken;
}

export async function clearPublicSession() {
  removeStorageItem(PUBLIC_SESSION_KEY);
  removeStorageItem(PUBLIC_ROLE_KEY);
  removeStorageItem(PUBLIC_REFRESH_KEY);

  await fetch("/api/auth/clear-cookie", {
    method: "POST",
  }).catch(() => null);
}

export async function resolvePublicSession(expectedRole?: string): Promise<ResolvedPublicSession | null> {
  const token = getPublicToken();
  const storedRole = getPublicRole();

  if (!token || !storedRole) {
    return null;
  }

  if (expectedRole && storedRole !== expectedRole) {
    await clearPublicSession();
    return null;
  }

  const initialMe = await fetchPublicMe(token);
  const firstUser = initialMe.user;

  if (initialMe.ok && firstUser) {
    if (expectedRole && firstUser.role !== expectedRole) {
      await clearPublicSession();
      return null;
    }

    if (firstUser.role !== storedRole) {
      setStorageItem(PUBLIC_ROLE_KEY, firstUser.role);
    }

    return {
      token,
      role: firstUser.role,
      user: firstUser,
    };
  }

  if (initialMe.status !== 401) {
    throw new Error(initialMe.message || "Gagal memverifikasi sesi buyer.");
  }

  const refreshedToken = await refreshPublicSession();
  if (!refreshedToken) {
    await clearPublicSession();
    return null;
  }

  const refreshedMe = await fetchPublicMe(refreshedToken);
  const refreshedUser = refreshedMe.user;

  if (!refreshedMe.ok || !refreshedUser) {
    if (refreshedMe.status === 401 || refreshedMe.status === 403) {
      await clearPublicSession();
      return null;
    }
    throw new Error(refreshedMe.message || "Gagal memverifikasi sesi buyer.");
  }

  if (expectedRole && refreshedUser.role !== expectedRole) {
    await clearPublicSession();
    return null;
  }

  setStorageItem(PUBLIC_ROLE_KEY, refreshedUser.role);

  return {
    token: refreshedToken,
    role: refreshedUser.role,
    user: refreshedUser,
  };
}

export function buildAdminUrl(path: string) {
  return `${ADMIN_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
