import rateLimit from "express-rate-limit";

/**
 * Rate limiter default. Pakai ini untuk endpoint sensitif (verify/webhook).
 * Ubah param sesuai kebutuhan.
 */
const limiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down." }
});

export default limiter;









