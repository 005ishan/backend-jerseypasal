import { Product, IProduct } from "../models/product.model";
import { CreateProductDTO, UpdateProductDTO } from "../dtos/product.dto";

export class ProductRepository {
  async create(
    data: CreateProductDTO & { imageUrl?: string },
  ): Promise<IProduct> {
    const product = new Product(data);
    return product.save();
  }

  async getAll(): Promise<IProduct[]> {
    return Product.find();
  }

  async getOne(id: string): Promise<IProduct | null> {
    return Product.findById(id);
  }

  async update(
    id: string,
    data: UpdateProductDTO & { imageUrl?: string },
  ): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }
  async getByCategory(category: string): Promise<IProduct[]> {
    return Product.find({ category }).sort({ createdAt: -1 });
  }
}
