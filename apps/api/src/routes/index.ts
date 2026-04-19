// apps/api/src/routes/index.ts
import { Router } from "express";
import productsRoutes from "./products.routes.js";
import ordersRoutes from "./orders-cart.routes.js";
import webhooksRoutes from "./webhooks.routes.js";
import approvalsRoutes from "./approvals.routes.js";
import authRoutes from "./auth.routes.js";
import reportsRoutes from "./reports-v2.routes.js";
import sellerRoutes from "./seller.routes.js";
import payoutsRoutes from "./payouts.routes.js";
import cmsRoutes from "./cms.routes.js";
import promosRoutes from "./promos.routes.js";
import buyerRoutes from "./buyer.routes.js";
import adminMarketplaceRoutes from "./admin-marketplace.routes.js";
import auditsRoutes from "./audits.routes.js";
import affiliatesRoutes from "./affiliates.routes.js";
import reviewsRoutes from "./reviews.routes.js";
import websiteReviewsRoutes from "./website-reviews.routes.js";
import cashierRoutes from "./cashier.routes.js";
import dashboardControlRoutes from "./dashboard-control.routes.js";
import accountManagementRoutes from "./account-management.routes.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/reports", reportsRoutes);
router.use("/seller", sellerRoutes);
// LEGACY / COMPAT ONLY: keep /partner alive temporarily while clients migrate to /seller.
router.use("/partner", sellerRoutes);
router.use("/payouts", payoutsRoutes);
router.use("/cms", cmsRoutes);
router.use("/promos", promosRoutes);
router.use("/buyer", buyerRoutes);
router.use("/admin-marketplace", adminMarketplaceRoutes);
router.use("/audits", auditsRoutes);
router.use("/affiliates", affiliatesRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/website-reviews", websiteReviewsRoutes);
router.use("/cashier", cashierRoutes);
router.use("/dashboard-control", dashboardControlRoutes);
router.use("/account-management", accountManagementRoutes);

// contoh guard di mount point
router.use("/approvals", auth, requireRole("ADMIN", "SUPER_ADMIN"), approvalsRoutes);

export default router;
