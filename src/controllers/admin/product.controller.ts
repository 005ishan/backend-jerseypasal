import { Request, Response } from "express";
import { ProductService } from "../../services/admin/product.service";

export class ProductController {
  private service = new ProductService();

  create = async (req: Request, res: Response) => {
    try {
      const product = await this.service.create(req.body, req.file);
      res.status(201).json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const products = await this.service.getAll();
      res.status(200).json({ success: true, data: products });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getOne = async (req: Request, res: Response) => {
    try {
      const product = await this.service.getOne(req.params.id);
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      res.status(200).json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const product = await this.service.update(
        req.params.id,
        req.body,
        req.file,
      );
      if (!product)
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      res.status(200).json({ success: true, data: product });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.service.delete(req.params.id);
      res.status(200).json({ success: true, message: "Product deleted" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
