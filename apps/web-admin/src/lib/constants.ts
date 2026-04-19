// apps/web-admin/src/lib/constants.ts

export const APP_BRAND = "Booking-Villa Admin";

// Auth / Session
export const SESSION_KEY = "bv_admin_token";

// Network
export const REQUEST_TIMEOUT_MS = 15_000;
export const RETRY_GET_ON_NETWORK_ERROR = true;

// Locale
export const DEFAULT_LOCALE = "id-ID";
export const DEFAULT_TIMEZONE = "Asia/Jakarta";

function normalizeUrl(value?: string) {
  return value?.replace(/\/+$/, "") ?? "";
}

function validatePublicEnvUrl(name: string, value: string) {
  if (!value) {
    throw new Error(`${name} is required in production`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(`${name} must use http or https`);
  }

  if (/^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
    throw new Error(`${name} cannot use localhost/127.0.0.1 in production`);
  }

  return value;
}

const rawApiBaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
const rawPublicAppUrl = normalizeUrl(process.env.NEXT_PUBLIC_PUBLIC_APP_URL);
const isProductionRuntime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build";

export const API_BASE_URL =
  isProductionRuntime
    ? validatePublicEnvUrl("NEXT_PUBLIC_API_BASE_URL", rawApiBaseUrl)
    : rawApiBaseUrl;

export const PUBLIC_APP_URL =
  isProductionRuntime
    ? validatePublicEnvUrl("NEXT_PUBLIC_PUBLIC_APP_URL", rawPublicAppUrl)
    : rawPublicAppUrl;
