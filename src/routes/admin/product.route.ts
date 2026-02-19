import { Router } from "express";
import { ProductController } from "../../controllers/admin/product.controller";
import { uploads } from "../../middlewares/upload.middleware";

const router = Router();
const controller = new ProductController();

router.post("/", uploads.single("image"), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id", uploads.single("image"), controller.update);
router.delete("/:id", controller.delete);
router.get("/category", controller.getByCategory);

export default router;
