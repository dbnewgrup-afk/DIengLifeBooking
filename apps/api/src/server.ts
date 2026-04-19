// apps/api/src/server.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appRoot = path.resolve(__dirname, "..");
const defaultEnvPath = path.join(appRoot, ".env");
const productionEnvPath = path.join(appRoot, ".env.production");

// Load env explicitly from apps/api/.env so startup does not depend on shell cwd.
// In production we also allow a dedicated .env.production file to override defaults.
if (existsSync(defaultEnvPath)) {
  dotenv.config({ path: defaultEnvPath });
}

if (
  existsSync(productionEnvPath) &&
  (process.env.NODE_ENV === "production" || !existsSync(defaultEnvPath))
) {
  dotenv.config({ path: productionEnvPath, override: true });
}

const { default: app } = await import("./app.js");
const { env } = await import("./lib/env.js");

const PORT = env.port;

const server = app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on ${PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    // eslint-disable-next-line no-console
    console.error(
      `[api] port ${PORT} is already in use. ` +
        "The API is likely already running from the monorepo root (`npm run dev`). " +
        "Stop the existing process first or change PORT in apps/api/.env before starting another instance."
    );
    process.exit(1);
  }

  throw error;
});
