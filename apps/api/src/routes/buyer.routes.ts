import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { getBuyerDashboard } from "../repositories/buyer-dashboard.repo.js";

const r = Router();

r.use(auth, requireRole("USER"));

r.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const dashboard = await getBuyerDashboard(userId);
    if (!dashboard) {
      return res.status(404).json({ error: "Buyer tidak ditemukan" });
    }

    return res.json({ ok: true, ...dashboard });
  } catch (error) {
    next(error);
  }
});

export default r;

