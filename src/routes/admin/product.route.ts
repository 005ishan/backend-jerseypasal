import { Router } from "express";
import { ProductController } from "../../controllers/admin/product.controller";
import { uploads } from "../../middlewares/upload.middleware";
import { Product } from "../../models/product.model";

const router = Router();
const controller = new ProductController();

router.get("/search", async (req, res) => {
  try {
    const query = req.query.query?.toString() || "";

    if (!query) {
      return res.status(400).json({ success: false, data: [] });
    }

    const products = await Product.find({
      name: { $regex: query, $options: "i" },
    }).limit(10);

    res.json({ success: true, data: products });
  } catch (err) {
    console.error("Search route error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/category", controller.getByCategory);

router.post("/", uploads.single("image"), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.put("/:id", uploads.single("image"), controller.update);
router.delete("/:id", controller.delete);

export default router;
