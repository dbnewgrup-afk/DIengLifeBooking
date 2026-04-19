"use client";

import { API_BASE_URL } from "@/lib/auth";

export type AffiliateAttribution = {
  code: string;
  landingPath: string;
  capturedAt: string;
  visitorKey: string;
  sessionKey: string;
  expiresAt: string;
};

type SearchParamsLike = {
  get(name: string): string | null;
  toString(): string;
};

const ATTRIBUTION_KEY = "bv_affiliate_attribution";
const VISITOR_KEY = "bv_affiliate_visitor";
const SESSION_KEY = "bv_affiliate_session";
const LAST_TRACKED_KEY = "bv_affiliate_last_tracked";
const AFFILIATE_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function canUseStorage() {
  return typeof window !== "undefined";
}

function makeId(prefix: string) {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${stamp}-${rand}`;
}

function normalizeCode(value?: string | null) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized || null;
}

function readLocal(key: string) {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeLocal(key: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readSession(key: string) {
  if (!canUseStorage()) return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeSession(key: string) {
  if (!canUseStorage()) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function ensureVisitorKey() {
  const existing = readLocal(VISITOR_KEY);
  if (existing) return existing;
  const next = makeId("AFFV");
  writeLocal(VISITOR_KEY, next);
  return next;
}

function ensureSessionKey() {
  const existing = readSession(SESSION_KEY);
  if (existing) return existing;
  const next = makeId("AFFS");
  writeSession(SESSION_KEY, next);
  return next;
}

export function getAffiliateAttribution(): AffiliateAttribution | null {
  const raw = readLocal(ATTRIBUTION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AffiliateAttribution;
    if (
      !parsed?.code ||
      !parsed?.capturedAt ||
      !parsed?.visitorKey ||
      !parsed?.sessionKey
    ) {
      removeLocal(ATTRIBUTION_KEY);
      return null;
    }

    const capturedAtMs = new Date(parsed.capturedAt).getTime();
    const expiresAtMs = parsed.expiresAt
      ? new Date(parsed.expiresAt).getTime()
      : capturedAtMs + AFFILIATE_ATTRIBUTION_TTL_MS;

    if (
      !Number.isFinite(capturedAtMs) ||
      !Number.isFinite(expiresAtMs) ||
      Date.now() > expiresAtMs
    ) {
      clearAffiliateAttribution();
      return null;
    }

    return parsed;
  } catch {
    removeLocal(ATTRIBUTION_KEY);
    return null;
  }
}

export function saveAffiliateAttribution(input: AffiliateAttribution) {
  writeLocal(ATTRIBUTION_KEY, JSON.stringify(input));
}

export function clearAffiliateAttribution() {
  removeLocal(ATTRIBUTION_KEY);
  removeSession(LAST_TRACKED_KEY);
}

export async function trackAffiliateClick(code: string, landingPath: string) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return;

  const dedupeKey = `${normalizedCode}:${landingPath}`;
  if (readSession(LAST_TRACKED_KEY) === dedupeKey) {
    return;
  }

  writeSession(LAST_TRACKED_KEY, dedupeKey);

  await fetch(`${API_BASE_URL}/affiliates/track/click`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: normalizedCode,
      landingPath,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      visitorKey: ensureVisitorKey(),
      sessionKey: ensureSessionKey(),
    }),
  }).catch(() => null);
}

export async function captureAffiliateAttribution(params: {
  pathname: string;
  searchParams: SearchParamsLike;
}) {
  const rawCode =
    params.searchParams.get("aff") ??
    params.searchParams.get("affiliate") ??
    params.searchParams.get("ref");
  const code = normalizeCode(rawCode);

  if (!code) {
    return getAffiliateAttribution();
  }

  const landingPath = params.searchParams.toString()
    ? `${params.pathname}?${params.searchParams.toString()}`
    : params.pathname;

  const attribution: AffiliateAttribution = {
    code,
    landingPath,
    capturedAt: new Date().toISOString(),
    visitorKey: ensureVisitorKey(),
    sessionKey: ensureSessionKey(),
    expiresAt: new Date(Date.now() + AFFILIATE_ATTRIBUTION_TTL_MS).toISOString(),
  };

  saveAffiliateAttribution(attribution);
  await trackAffiliateClick(code, landingPath);
  return attribution;
}
