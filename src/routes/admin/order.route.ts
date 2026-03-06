// routes/admin/order.route.ts  (admin-facing)
import { Router } from "express";
import { OrderController } from "../../controllers/order.controller";
import { adminMiddleware, authorizedMiddleware } from "../../middlewares/authorized.middleware";

const router = Router();
const controller = new OrderController();

router.use(authorizedMiddleware);
router.use(adminMiddleware);

router.get("/", controller.getAllOrders);
router.patch("/:id/status", controller.updateStatus);

export default router;