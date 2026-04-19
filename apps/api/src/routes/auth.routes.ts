import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
// apps/api/src/routes/auth.routes.ts

import * as AuthController from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.js";

const r = Router();

// Auth flows
r.post("/login", AuthController.login);
r.post("/login/user", AuthController.loginUser);
r.post("/login/admin", AuthController.loginAdmin);
r.post("/login/seller", AuthController.loginSeller);
r.post("/register/user", AuthController.registerUser);
r.post("/register/seller", AuthController.registerSeller);
r.post("/refresh", AuthController.refresh);
r.get("/me", auth, AuthController.me);
r.get("/password-reset-access/me", auth, AuthController.myPasswordResetAccessState);
r.post("/password-reset-access/request", auth, AuthController.requestMyPasswordResetAccess);
r.post("/password-reset/me", auth, AuthController.resetMyPassword);

export default r;










