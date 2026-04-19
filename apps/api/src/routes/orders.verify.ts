
// ⚠️ LEGACY - DO NOT USE
/**
 * LEGACY / COMPAT ONLY
 *
 * Route verifikasi ini hanya untuk jalur provider lama dan tidak dipasang di
 * router aktif. Flow transaksi utama sekarang memakai Booking + Payment dengan
 * Xendit sebagai provider aktif.
 */
import db from "../lib/db.js";
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
const router = Router();

// Ambil global fetch (Node 18+). Casting ke any biar TS tidak butuh lib DOM.
const fetchAny: any = (globalThis as any).fetch;

router.get("/api/orders/:code/verify", async (req: Request, res: Response) => {
  const code = req.params.code;
  const order = await db.order.findUnique({ where: { code } });
  if (!order) return res.status(404).json({ error: "order not found" });

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
  if (!serverKey) return res.status(500).json({ error: "server key missing" });

  const basic = Buffer.from(`${serverKey}:`).toString("base64");
  const base = process.env.MIDTRANS_BASE_URL || "https://api.sandbox.midtrans.com";

  try {
    const resp = await fetchAny(`${base}/v2/${encodeURIComponent(code)}/status`, {
      headers: { Authorization: `Basic ${basic}` },
    });
    const json = await resp.json();

    // Di sini opsional: mapping + upsert Payment seperti webhook
    return res.json({ ok: true, status: json?.transaction_status, raw: json });
  } catch (e: any) {
    return res.status(502).json({ error: "legacy provider fetch failed", detail: e?.message || String(e) });
  }
});

export default router;










/**
 * LEGACY TRANSACTION FLOW
 *
 * This verification route checks the old provider + `order` path and is not
 * mounted in the active router. Public transaction verification must rely on
 * the active `Booking + Payment` flow with Xendit instead.
 */
