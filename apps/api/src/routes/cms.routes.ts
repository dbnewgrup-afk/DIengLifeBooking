import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import {
  HomepageSectionParams,
  UpdateHomepageSectionBody,
} from "../schemas/cms.schema.js";
import * as cmsRepo from "../repositories/cms.repo.js";

const r = Router();

r.get("/homepage/public", async (_req, res, next) => {
  try {
    const sections = await cmsRepo.getPublishedHomepageSections();
    return res.json({ ok: true, items: sections });
  } catch (err) {
    next(err);
  }
});

r.use(auth, requireRole("ADMIN", "SUPER_ADMIN"));

r.get("/homepage", async (_req, res, next) => {
  try {
    const sections = await cmsRepo.listHomepageSections();
    return res.json({ ok: true, items: sections });
  } catch (err) {
    next(err);
  }
});

r.patch("/homepage/:key", async (req, res, next) => {
  try {
    const { key } = HomepageSectionParams.parse(req.params);
    const payload = UpdateHomepageSectionBody.parse(req.body);
    const updated = await cmsRepo.updateHomepageSectionDraft(key, payload);
    if (!updated) {
      return res.status(404).json({ error: "Section not found" });
    }
    return res.json({ ok: true, item: updated });
  } catch (err) {
    next(err);
  }
});

r.post("/homepage/:key/publish", async (req, res, next) => {
  try {
    const { key } = HomepageSectionParams.parse(req.params);
    const updated = await cmsRepo.publishHomepageSection(key);
    if (!updated) {
      return res.status(404).json({ error: "Section not found" });
    }
    return res.json({ ok: true, item: updated });
  } catch (err) {
    next(err);
  }
});

export default r;
