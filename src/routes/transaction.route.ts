import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";

const router = Router();
const controller = new TransactionController();

router.post("/payment/success", controller.paymentSuccess);
router.get("/:userId", controller.getUserTransactions);
router.get("/", controller.getAllTransactions);

export default router;
