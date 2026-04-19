/* apps/api/src/routes/invite.ts */
import { Router } from "express";
import { httpError } from "../lib/errors.js";

const router = Router();

// Placeholder endpoints until real controller exists
router.post("/", (_req, res) => {
  // e.g., create invite for admin/seller
  res.status(501).json({ error: "Not Implemented", code: "INVITE_CREATE_TODO" });
});

router.get("/:token", (req, res) => {
  // e.g., validate invite token
  const { token } = req.params as { token?: string };
  if (!token) throw httpError(400, "Token is required", "REQ_TOKEN");
  res.status(501).json({ error: "Not Implemented", code: "INVITE_VALIDATE_TODO" });
});

export default router;
