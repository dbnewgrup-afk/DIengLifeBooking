type RuntimeEnv = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  databaseHost: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  appBaseUrl: string;
  corsOrigins: string[];
  serviceName: string;
};

const PROD = process.env.NODE_ENV === "production";
const DISALLOWED_JWT_SECRETS = new Set([
  "",
  "dev_jwt_please_change",
  "please_change_me_super_secret",
]);

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function ensure(name: string, message?: string): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(message ?? `Missing required env: ${name}`);
  }
  return value;
}

function parseUrl(name: string, raw: string): URL {
  try {
    return new URL(raw);
  } catch {
    throw new Error(`Invalid URL in ${name}: ${raw}`);
  }
}

function validatePublicUrl(name: string, raw: string): string {
  const parsed = parseUrl(name, raw);
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  if (PROD && /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
    throw new Error(`${name} cannot use localhost/127.0.0.1 in production`);
  }
  return raw.replace(/\/+$/, "");
}

function validateCorsOrigins(raw: string): string[] {
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (PROD && origins.length === 0) {
    throw new Error("CORS_ORIGINS must be set in production");
  }

  for (const origin of origins) {
    const parsed = parseUrl("CORS_ORIGINS", origin);
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
      throw new Error(`CORS_ORIGINS entries must be bare origins: ${origin}`);
    }
    if (PROD && /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
      throw new Error(`CORS_ORIGINS cannot contain localhost/127.0.0.1 in production: ${origin}`);
    }
  }

  return origins;
}

function validateDatabaseUrl(raw: string): { value: string; host: string } {
  const parsed = parseUrl("DATABASE_URL", raw);
  if (!/^mysql:$/.test(parsed.protocol)) {
    throw new Error("DATABASE_URL must use a MySQL connection string");
  }
  if (!parsed.hostname) {
    throw new Error("DATABASE_URL must include a database host");
  }
  if (parsed.hostname === "db" && process.env.ALLOW_DOCKER_DB_HOST !== "true") {
    throw new Error(
      "DATABASE_URL still uses host `db`. Use the real DB host or set ALLOW_DOCKER_DB_HOST=true only inside Docker network."
    );
  }
  return { value: raw, host: parsed.hostname };
}

function validateJwtSecret(raw: string): string {
  if (DISALLOWED_JWT_SECRETS.has(raw)) {
    throw new Error("JWT_SECRET must be set to a strong non-default value");
  }
  if (raw.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return raw;
}

const database = validateDatabaseUrl(ensure("DATABASE_URL"));
const jwtSecret = validateJwtSecret(ensure("JWT_SECRET"));

export const env: RuntimeEnv = {
  nodeEnv: readEnv("NODE_ENV") || "development",
  port: Number(readEnv("PORT") || "4000"),
  databaseUrl: database.value,
  databaseHost: database.host,
  jwtSecret,
  jwtRefreshSecret: readEnv("JWT_REFRESH_SECRET") || `${jwtSecret}_refresh`,
  jwtAccessTtl: readEnv("JWT_ACCESS_TTL") || "15m",
  jwtRefreshTtl: readEnv("JWT_REFRESH_TTL") || "7d",
  appBaseUrl: validatePublicUrl("APP_BASE_URL", ensure("APP_BASE_URL")),
  corsOrigins: validateCorsOrigins(readEnv("CORS_ORIGINS")),
  serviceName: readEnv("SERVICE_NAME") || "booking-villa-api",
};
