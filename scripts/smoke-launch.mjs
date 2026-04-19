#!/usr/bin/env node

const PUBLIC_BASE_URL = (process.env.SMOKE_PUBLIC_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const ADMIN_BASE_URL = (process.env.SMOKE_ADMIN_BASE_URL || process.env.SMOKE_WEB_BASE_URL || "http://127.0.0.1:3010").replace(
  /\/+$/,
  ""
);
const API_BASE_URL = (process.env.SMOKE_API_BASE_URL || "http://127.0.0.1:4000/api").replace(/\/+$/, "");
const API_ROOT_URL = API_BASE_URL.replace(/\/api$/, "");

const DEFAULT_PASSWORD = "admin123";
const ACCOUNTS = {
  user: {
    email: process.env.SMOKE_USER_EMAIL || "user@system.local",
    password: process.env.SMOKE_USER_PASSWORD || DEFAULT_PASSWORD,
  },
  seller: {
    email: process.env.SMOKE_SELLER_EMAIL || "seller@system.local",
    password: process.env.SMOKE_SELLER_PASSWORD || DEFAULT_PASSWORD,
  },
  affiliate: {
    email: process.env.SMOKE_AFFILIATE_EMAIL || "affiliate@system.local",
    password: process.env.SMOKE_AFFILIATE_PASSWORD || DEFAULT_PASSWORD,
  },
  admin: {
    email: process.env.SMOKE_ADMIN_EMAIL || "admin@system.local",
    password: process.env.SMOKE_ADMIN_PASSWORD || DEFAULT_PASSWORD,
  },
  kasir: {
    email: process.env.SMOKE_KASIR_EMAIL || "kasir@system.local",
    password: process.env.SMOKE_KASIR_PASSWORD || DEFAULT_PASSWORD,
  },
  superAdmin: {
    email: process.env.SMOKE_SUPER_ADMIN_EMAIL || "super1@system.local",
    password: process.env.SMOKE_SUPER_ADMIN_PASSWORD || DEFAULT_PASSWORD,
  },
};

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setFromResponse(response) {
    const values =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : splitSetCookieHeader(response.headers.get("set-cookie"));

    for (const raw of values) {
      const firstPart = raw.split(";")[0];
      const separatorIndex = firstPart.indexOf("=");
      if (separatorIndex <= 0) continue;
      const name = firstPart.slice(0, separatorIndex).trim();
      const value = firstPart.slice(separatorIndex + 1).trim();
      if (!value) {
        this.cookies.delete(name);
        continue;
      }
      this.cookies.set(name, value);
    }
  }

  header() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

function splitSetCookieHeader(value) {
  if (!value) return [];

  const parts = [];
  let current = "";
  let inExpires = false;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextSlice = value.slice(index, index + 8).toLowerCase();
    if (nextSlice === "expires=") {
      inExpires = true;
    }
    if (char === "," && !inExpires) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    if (inExpires && char === ";") {
      inExpires = false;
    }
    current += char;
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function logStep(message) {
  console.log(`\n[step] ${message}`);
}

function pass(message) {
  console.log(`[pass] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

async function request(url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
  });
  return response;
}

async function expectRedirect(url, expectedPath, init) {
  const response = await request(url, init);
  const location = response.headers.get("location") || "";
  if (response.status < 300 || response.status >= 400) {
    fail(`Expected redirect from ${url}, got ${response.status}`);
  }
  if (!location.includes(expectedPath)) {
    fail(`Expected redirect to include "${expectedPath}" but got "${location}"`);
  }
  pass(`${url} redirects to ${location}`);
}

async function expectOkHtml(url, init) {
  const response = await request(url, init);
  const contentType = response.headers.get("content-type") || "";
  if (response.status !== 200) {
    fail(`Expected 200 from ${url}, got ${response.status}`);
  }
  if (!contentType.includes("text/html")) {
    fail(`Expected HTML response from ${url}, got "${contentType}"`);
  }
  pass(`${url} returns HTML 200`);
  return response;
}

async function expectHtmlOrRedirect(url, redirectPath, init) {
  const response = await request(url, init);
  const contentType = response.headers.get("content-type") || "";
  if (response.status === 200 && contentType.includes("text/html")) {
    pass(`${url} returns HTML 200`);
    return response;
  }

  const location = response.headers.get("location") || "";
  if (response.status >= 300 && response.status < 400 && location.includes(redirectPath)) {
    pass(`${url} redirects to ${location}`);
    return response;
  }

  fail(`Expected HTML 200 or redirect to "${redirectPath}" from ${url}, got ${response.status} (${contentType}) ${location}`);
}

async function expectJsonOk(url, init) {
  const response = await request(url, init);
  const text = await response.text();
  if (response.status !== 200) {
    fail(`Expected 200 from ${url}, got ${response.status}: ${text}`);
  }
  pass(`${url} returns 200`);
  return text ? JSON.parse(text) : null;
}

async function expectStatus(url, status, init) {
  const response = await request(url, init);
  const text = await response.text();
  if (response.status !== status) {
    fail(`Expected ${status} from ${url}, got ${response.status}: ${text}`);
  }
  pass(`${url} returns ${status}`);
  return text ? safeJson(text) : null;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function login(path, email, password) {
  const response = await request(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = safeJson(await response.text());
  if (!response.ok) {
    fail(`Login failed for ${path}: ${response.status} ${JSON.stringify(payload)}`);
  }
  pass(`Login OK for ${path} (${email})`);
  return payload;
}

function expectRole(session, expectedRole, label) {
  if (session.user?.role !== expectedRole) {
    fail(`Unexpected ${label} role: ${session.user?.role}`);
  }
  pass(`${label} role resolved as ${expectedRole}`);
}

async function setWebSession(baseUrl, session) {
  const jar = new CookieJar();
  const response = await request(`${baseUrl}/api/auth/set-cookie`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      token: session.accessToken,
      role: session.user?.role,
      portal: session.auth?.portal,
      redirectTo: session.auth?.redirectTo,
    }),
  });

  if (!response.ok) {
    fail(`Failed to set auth cookie on ${baseUrl}: ${response.status}`);
  }

  jar.setFromResponse(response);
  pass(`Web session cookie set on ${baseUrl} for role ${session.user?.role}`);
  return jar;
}

async function clearWebSession(baseUrl, jar) {
  const response = await request(`${baseUrl}/api/auth/clear-cookie`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: jar.header(),
    },
  });

  if (!response.ok) {
    fail(`Failed to clear auth cookie on ${baseUrl}: ${response.status}`);
  }

  jar.setFromResponse(response);
  pass(`Web session cleared on ${baseUrl}`);
}

async function main() {
  logStep("API readiness");
  await expectStatus(`${API_ROOT_URL}/readyz`, 200);

  logStep("Unauthenticated dashboard guards");
  await expectRedirect(`${ADMIN_BASE_URL}/seller`, "/login/seller");
  await expectRedirect(`${ADMIN_BASE_URL}/partner`, "/login/seller");
  await expectRedirect(`${ADMIN_BASE_URL}/admin`, "/login/admin");
  await expectRedirect(`${ADMIN_BASE_URL}/super-admin`, "/login/admin");
  await expectRedirect(`${ADMIN_BASE_URL}/kasir`, "/login/admin");

  logStep("Login all final roles");
  const userSession = await login("/auth/login/user", ACCOUNTS.user.email, ACCOUNTS.user.password);
  const sellerSession = await login("/auth/login/seller", ACCOUNTS.seller.email, ACCOUNTS.seller.password);
  const affiliateSession = await login("/auth/login/seller", ACCOUNTS.affiliate.email, ACCOUNTS.affiliate.password);
  const adminSession = await login("/auth/login/admin", ACCOUNTS.admin.email, ACCOUNTS.admin.password);
  const kasirSession = await login("/auth/login/admin", ACCOUNTS.kasir.email, ACCOUNTS.kasir.password);
  const superAdminSession = await login(
    "/auth/login/admin",
    ACCOUNTS.superAdmin.email,
    ACCOUNTS.superAdmin.password
  );

  expectRole(userSession, "USER", "Buyer");
  expectRole(sellerSession, "SELLER", "Seller");
  expectRole(affiliateSession, "AFFILIATE", "Affiliate");
  expectRole(adminSession, "ADMIN", "Admin");
  expectRole(kasirSession, "KASIR", "Kasir");
  expectRole(superAdminSession, "SUPER_ADMIN", "Super admin");

  pass(`Seller redirect target: ${sellerSession.auth?.redirectTo || "/seller"}`);
  pass(`Affiliate redirect target: ${affiliateSession.auth?.redirectTo || "/seller"}`);
  pass(`Admin redirect target: ${adminSession.auth?.redirectTo || "/admin"}`);
  pass(`Kasir redirect target: ${kasirSession.auth?.redirectTo || "/kasir"}`);
  pass(`Super admin redirect target: ${superAdminSession.auth?.redirectTo || "/super-admin"}`);

  logStep("Wrong-role login protections");
  await expectStatus(`${API_BASE_URL}/auth/login/admin`, 403, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: ACCOUNTS.seller.email,
      password: ACCOUNTS.seller.password,
    }),
  });
  await expectStatus(`${API_BASE_URL}/auth/login/admin`, 403, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: ACCOUNTS.affiliate.email,
      password: ACCOUNTS.affiliate.password,
    }),
  });
  await expectStatus(`${API_BASE_URL}/auth/login/seller`, 403, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: ACCOUNTS.admin.email,
      password: ACCOUNTS.admin.password,
    }),
  });

  logStep("API smoke by role");
  const userAuthHeader = {
    Authorization: `Bearer ${userSession.accessToken}`,
    Accept: "application/json",
  };
  const sellerAuthHeader = {
    Authorization: `Bearer ${sellerSession.accessToken}`,
    Accept: "application/json",
  };
  const affiliateAuthHeader = {
    Authorization: `Bearer ${affiliateSession.accessToken}`,
    Accept: "application/json",
  };
  const adminAuthHeader = {
    Authorization: `Bearer ${adminSession.accessToken}`,
    Accept: "application/json",
  };
  const kasirAuthHeader = {
    Authorization: `Bearer ${kasirSession.accessToken}`,
    Accept: "application/json",
  };
  const superAdminAuthHeader = {
    Authorization: `Bearer ${superAdminSession.accessToken}`,
    Accept: "application/json",
  };

  const me = await expectJsonOk(`${API_BASE_URL}/auth/me`, { headers: userAuthHeader });
  if (me?.user?.role !== "USER") {
    fail(`Expected buyer /auth/me role USER, got ${me?.user?.role}`);
  }
  pass("Buyer API session is canonical");

  await expectJsonOk(`${API_BASE_URL}/seller/balance`, { headers: sellerAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/partner/balance`, { headers: sellerAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/reports/seller/me`, { headers: sellerAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/reports/partner/me`, { headers: sellerAuthHeader });

  await expectJsonOk(`${API_BASE_URL}/affiliates/me/overview`, { headers: affiliateAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/affiliates/me/links`, { headers: affiliateAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/affiliates/me/balance`, { headers: affiliateAuthHeader });

  await expectJsonOk(`${API_BASE_URL}/admin-marketplace/overview`, { headers: adminAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/cashier/overview`, { headers: kasirAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/admin-marketplace/overview`, { headers: superAdminAuthHeader });
  await expectJsonOk(`${API_BASE_URL}/affiliates/admin-summary`, { headers: superAdminAuthHeader });

  logStep("Buyer public app session");
  const buyerJar = await setWebSession(PUBLIC_BASE_URL, userSession);
  const buyerHeaders = { Cookie: buyerJar.header() };
  await expectOkHtml(`${PUBLIC_BASE_URL}/dashboard`, { headers: buyerHeaders });

  logStep("Seller and affiliate dashboard session");
  const sellerJar = await setWebSession(ADMIN_BASE_URL, sellerSession);
  const sellerHeaders = { Cookie: sellerJar.header() };
  await expectOkHtml(`${ADMIN_BASE_URL}/seller`, { headers: sellerHeaders });
  await expectHtmlOrRedirect(`${ADMIN_BASE_URL}/partner`, "/seller", { headers: sellerHeaders });
  await expectRedirect(`${ADMIN_BASE_URL}/admin`, sellerSession.auth?.redirectTo || "/seller", {
    headers: sellerHeaders,
  });

  const affiliateJar = await setWebSession(ADMIN_BASE_URL, affiliateSession);
  const affiliateHeaders = { Cookie: affiliateJar.header() };
  await expectOkHtml(`${ADMIN_BASE_URL}/seller`, { headers: affiliateHeaders });
  await expectHtmlOrRedirect(`${ADMIN_BASE_URL}/partner`, "/seller", { headers: affiliateHeaders });
  await expectRedirect(`${ADMIN_BASE_URL}/admin`, affiliateSession.auth?.redirectTo || "/seller", {
    headers: affiliateHeaders,
  });

  logStep("Admin, kasir, and super admin dashboard session");
  const adminJar = await setWebSession(ADMIN_BASE_URL, adminSession);
  const adminHeaders = { Cookie: adminJar.header() };
  await expectOkHtml(`${ADMIN_BASE_URL}${adminSession.auth?.redirectTo || "/admin"}`, {
    headers: adminHeaders,
  });
  await expectRedirect(`${ADMIN_BASE_URL}/seller`, adminSession.auth?.redirectTo || "/admin", {
    headers: adminHeaders,
  });

  const kasirJar = await setWebSession(ADMIN_BASE_URL, kasirSession);
  const kasirHeaders = { Cookie: kasirJar.header() };
  await expectOkHtml(`${ADMIN_BASE_URL}${kasirSession.auth?.redirectTo || "/kasir"}`, {
    headers: kasirHeaders,
  });

  const superAdminJar = await setWebSession(ADMIN_BASE_URL, superAdminSession);
  const superAdminHeaders = { Cookie: superAdminJar.header() };
  await expectOkHtml(`${ADMIN_BASE_URL}${superAdminSession.auth?.redirectTo || "/super-admin"}`, {
    headers: superAdminHeaders,
  });
  await expectRedirect(`${ADMIN_BASE_URL}/seller`, superAdminSession.auth?.redirectTo || "/super-admin", {
    headers: superAdminHeaders,
  });

  logStep("Logout clears dashboard sessions");
  await clearWebSession(ADMIN_BASE_URL, sellerJar);
  await expectRedirect(`${ADMIN_BASE_URL}/seller`, "/login/seller", {
    headers: { Cookie: sellerJar.header() },
  });
  await clearWebSession(PUBLIC_BASE_URL, buyerJar);
  pass("Buyer public session clear endpoint responded OK");

  console.log("\nSmoke launch checks completed successfully.");
}

main().catch((error) => {
  console.error(`\nSmoke launch checks failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
