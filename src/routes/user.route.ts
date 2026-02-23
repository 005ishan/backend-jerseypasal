import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const controller = new UserController();

router.post("/:userId/favourite", controller.toggleFavourite);
router.get("/:userId/favourite", controller.getFavourites);

router.post("/:userId/cart", authorizedMiddleware, controller.addToCart);
router.put("/:userId/cart", controller.updateCartItem);
router.delete("/:userId/cart", controller.removeCartItem);
router.get("/:userId/cart", controller.getCart);
router.delete("/:userId/cart/clear", authorizedMiddleware, controller.clearCart);

router.put("/:id",authorizedMiddleware, controller.updateCustomer);

export default router;
