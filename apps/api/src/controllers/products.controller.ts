import type { Request, Response, NextFunction } from "express";
import {
  svcListProducts,
  svcGetProduct,
  svcCreateProduct,
  svcUpdateProduct,
  svcSoftDeleteProduct,
} from "../services/products.service.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svcListProducts(req.query as any);
    res.setHeader("Cache-Control", "public, max-age=15");
    return res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svcGetProduct((req.params as any).idOrSlug);
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svcCreateProduct(req.body);
    return res.status(201).json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}

export async function patch(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svcUpdateProduct((req.params as any).idOrSlug, req.body);
    return res.json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}

export async function softDelete(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await svcSoftDeleteProduct((req.params as any).idOrSlug);
    return res.json({ ok: true, item });
  } catch (e) {
    next(e);
  }
}
