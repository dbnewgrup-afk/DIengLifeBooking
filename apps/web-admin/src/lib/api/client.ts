// apps/web-admin/src/lib/api/client.ts

import { API_BASE_URL, REQUEST_TIMEOUT_MS, RETRY_GET_ON_NETWORK_ERROR } from "../constants";
import type { ApiError } from "./schemas";
import { getToken } from "../auth/session";

type Query = Record<string, string | number | boolean | undefined>;

type RequestOpts = {
  query?: Query;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function buildQuery(q?: Query): string {
  if (!q) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function joinUrl(base: string, path: string, q?: Query): string {
  const cleaned = `${base || ""}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/{2,}/g, "/");
  // Preserve protocol slashes lost by regex above
  const withProto = cleaned.replace(/^https:\//, "https://").replace(/^http:\//, "http://");
  return `${withProto}${buildQuery(q)}`;
}

function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError; // fetch network errors biasanya TypeError
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (res.ok) {
    return isJson ? ((await res.json()) as T) : (await res.text() as unknown as T);
  }

  let payload: unknown = null;
  try {
    payload = isJson ? await res.json() : await res.text();
  } catch {
    payload = null;
  }

  const payloadRecord = isObjectRecord(payload) ? payload : null;

  const err: ApiError = {
    status: res.status,
    code: typeof payloadRecord?.code === "string" ? payloadRecord.code : undefined,
    message:
      (typeof payload === "string" && payload) ||
      (typeof payloadRecord?.error === "string" ? payloadRecord.error : undefined) ||
      (typeof payloadRecord?.message === "string" ? payloadRecord.message : undefined) ||
      res.statusText ||
      "Request failed",
    details: payloadRecord?.details,
  };
  throw err;
}

async function doFetch<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  opts?: RequestOpts
): Promise<T> {
  if (!API_BASE_URL) {
    const err: ApiError = {
      status: 0,
      code: "ENV_MISSING",
      message: "NEXT_PUBLIC_API_BASE_URL is not configured",
    };
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Math.max(1_000, opts?.timeoutMs ?? REQUEST_TIMEOUT_MS)
  );

  // Chain external signal if provided
  if (opts?.signal) {
    opts.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts?.headers || {}),
  };

  const url = joinUrl(API_BASE_URL, path, opts?.query);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return await parseResponse<T>(res);
  } catch (e) {
    clearTimeout(timeout);

    // Retry sekali untuk GET jika error jaringan
    if (
      method === "GET" &&
      RETRY_GET_ON_NETWORK_ERROR &&
      isNetworkError(e)
    ) {
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 200));
      const res2 = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
        cache: "no-store",
      }).catch((ee) => {
        throw ee;
      });
      return await parseResponse<T>(res2);
    }

    // Timeout atau abort
    if (isAbortError(e)) {
      const err: ApiError = {
        status: 0,
        code: "TIMEOUT",
        message: "Request timed out",
      };
      throw err;
    }

    // Jaringan
    if (isNetworkError(e)) {
      const err: ApiError = {
        status: 0,
        code: "NETWORK_ERROR",
        message: "Network error",
      };
      throw err;
    }

    // Jika server sudah melempar ApiError
    throw e;
  }
}

export const api = {
  get<T>(path: string, opts?: RequestOpts) {
    return doFetch<T>("GET", path, undefined, opts);
  },
  post<T>(path: string, body: unknown, opts?: RequestOpts) {
    return doFetch<T>("POST", path, body, opts);
  },
  patch<T>(path: string, body: unknown, opts?: RequestOpts) {
    return doFetch<T>("PATCH", path, body, opts);
  },
  del<T>(path: string, opts?: RequestOpts) {
    return doFetch<T>("DELETE", path, undefined, opts);
  },
};
