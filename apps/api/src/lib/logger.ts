import { createRequire } from "node:module";
import pino from "pino";

const require = createRequire(import.meta.url);
const isProduction = process.env.NODE_ENV === "production";

function canUsePrettyTransport(): boolean {
  if (isProduction) return false;

  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: canUsePrettyTransport()
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss.l" }
      }
    : undefined
});

export default logger;