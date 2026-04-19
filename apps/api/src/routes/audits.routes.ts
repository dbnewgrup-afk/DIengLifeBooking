import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import * as auditsRepo from "../repositories/audits.repo.js";

const r = Router();

r.get("/", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const action = typeof req.query.action === "string" ? req.query.action : undefined;
    const data = await auditsRepo.list({ page, pageSize, action });
    return res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
});

r.post("/:id/review", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const item = await auditsRepo.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Audit tidak ditemukan" });
    }

    // TODO: model Audit belum punya reviewed flag khusus, jadi review dipersist
    // sebagai audit event baru agar aksi super-admin tetap tercatat di backend.
    await auditsRepo.write({
      action: "REVIEW_AUDIT",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "AUDIT",
      targetId: req.params.id,
      meta: {
        reviewedAuditId: req.params.id,
        reviewedAction: item.action,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.delete("/:id", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const deleted = await auditsRepo.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Audit tidak ditemukan" });
    }

    await auditsRepo.write({
      action: "DELETE_AUDIT",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "AUDIT",
      targetId: deleted.id,
      meta: {
        deletedAction: deleted.action,
        deletedTargetType: deleted.targetType,
        deletedTargetId: deleted.targetId,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item: deleted });
  } catch (error) {
    next(error);
  }
});

export default r;
