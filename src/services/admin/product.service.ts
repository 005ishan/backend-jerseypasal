import { ProductRepository } from "../../repositories/product.repository";
import { CreateProductDTO, UpdateProductDTO } from "../../dtos/product.dto";

import { Product, IProduct } from "../../models/product.model";

export class ProductService {
  private repository = new ProductRepository();

  async create(
    data: CreateProductDTO,
    file?: Express.Multer.File,
  ): Promise<IProduct> {
    let imageUrl: string | undefined;
    if (file) imageUrl = `/uploads/products/${file.filename}`;
    return this.repository.create({ ...data, imageUrl });
  }
  getAll = async (category?: "club" | "country") => {
    const filter: any = {};
    if (category) filter.category = category; 
    return await Product.find(filter).sort({ createdAt: -1 });
  };

  async getOne(id: string): Promise<IProduct | null> {
    return this.repository.getOne(id);
  }

  async update(
    id: string,
    data: UpdateProductDTO,
    file?: Express.Multer.File,
  ): Promise<IProduct | null> {
    let imageUrl: string | undefined;
    if (file) imageUrl = `/uploads/products/${file.filename}`;
    return this.repository.update(id, { ...data, imageUrl });
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
