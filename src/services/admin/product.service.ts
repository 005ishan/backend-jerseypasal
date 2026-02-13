import { ProductRepository } from "../../repositories/product.repository";
import { CreateProductDTO, UpdateProductDTO } from "../../dtos/product.dto";
import { Express } from "express";

export class ProductService {
  private repository = new ProductRepository();

  async create(data: CreateProductDTO, file?: Express.Multer.File) {
    let imageUrl;
    if (file) imageUrl = `/uploads/products/${file.filename}`;
    return this.repository.create({ ...data, imageUrl });
  }

  async getAll() {
    return this.repository.getAll();
  }

  async getOne(id: string) {
    return this.repository.getOne(id);
  }

  async update(id: string, data: UpdateProductDTO, file?: Express.Multer.File) {
    let imageUrl;
    if (file) imageUrl = `/uploads/products/${file.filename}`;
    return this.repository.update(id, { ...data, imageUrl });
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
