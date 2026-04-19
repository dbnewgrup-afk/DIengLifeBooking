import cors from "cors";

import { env } from "./env.js";

const origins = env.corsOrigins;

const corsMiddleware = cors({
  origin: origins.length ? origins : true,
  credentials: true,
  allowedHeaders: ["Authorization", "Content-Type"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
});

export default corsMiddleware;









