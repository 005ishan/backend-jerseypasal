// routes/order.route.ts  (customer-facing)
import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const controller = new OrderController();

router.post("/", authorizedMiddleware, controller.createOrder);
router.get("/:userId", authorizedMiddleware, controller.getUserOrders);

export default router;