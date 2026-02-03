import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/logout", authController.logout);

export default router;
