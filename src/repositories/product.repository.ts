import { ProductModel } from "../models/product.model";
import { CreateProductDTO } from "../dtos/product.dto";

export class ProductRepository {
  async create(data: CreateProductDTO & { image?: string }) {
    return await ProductModel.create(data);
  }

  async findAll() {
    return await ProductModel.find().sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return await ProductModel.findById(id);
  }

  async update(id: string, data: Partial<CreateProductDTO>) {
    return await ProductModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return await ProductModel.findByIdAndDelete(id);
  }
}
