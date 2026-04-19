// apps/api/src/app.ts
import { Prisma } from "@prisma/client";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import pino from "pino";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";

// RELATIF ⇒ wajib .js di NodeNext
import cors from "./lib/cors.js";
import routes from "./routes/index.js";
import prisma from "./lib/db.js";

const app = express();

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

app.set("trust proxy", true);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

// pino-http: kadang tipe-nya kebaca module, cast saja biar TS diam
app.use(
  (pinoHttp as unknown as (opts?: any) => any)({
    logger,
    genReqId: () => randomUUID(),
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// kalau `cors` adalah middleware siap pakai, biarkan tanpa ().
// kalau itu factory, ubah ke `app.use(cors())`.
app.use(cors);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck (infra/probe dan FE)
app.get("/healthz", (_req: Request, res: Response) =>
  res.status(200).type("text/plain").send("ok")
);
app.get("/health", (_req: Request, res: Response) =>
  res.status(200).type("text/plain").send("ok")
);

// Readyz check (DB ping)
app.get("/readyz", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ db: "ok" });
  } catch {
    res.status(503).json({ db: "down" });
  }
});

// Info build sederhana untuk diagnosa FE
app.get("/api/_info", (_req: Request, res: Response) => {
  res.json({
    service: process.env.SERVICE_NAME || "booking-villa-api",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Router utama di bawah "/api"
app.use("/api", routes);

// 404 generic
app.use((_req: Request, res: Response) =>
  res.status(404).json({ error: "Not Found" })
);

// Error handler no-stack di prod
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== "production") console.error(err);
  const rawCode =
    typeof err === "object" && err && "status" in err && typeof (err as any).status === "number"
      ? (err as any).status
      : 500;
  const rawMessage =
    typeof err === "object" && err && "message" in err
      ? String((err as any).message)
      : "Internal Server Error";
  const prismaCode =
    typeof err === "object" && err && "code" in err && typeof (err as any).code === "string"
      ? String((err as any).code)
      : undefined;
  const isDatabaseUnavailable =
    err instanceof Prisma.PrismaClientInitializationError ||
    prismaCode === "P1001" ||
    /can't reach database server|can't connect to database server|econnrefused|connection refused/i.test(
      rawMessage
    );
  const detail =
    typeof err === "object" && err && "detail" in err ? (err as any).detail : undefined;

  if (isDatabaseUnavailable) {
    return res.status(503).json({
      error: "Layanan database sedang tidak tersedia. Coba lagi beberapa saat.",
    });
  }

  return res
    .status(rawCode)
    .json(detail ? { error: rawMessage, detail } : { error: rawMessage });
});

export default app;
