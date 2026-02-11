import { ProductRepository } from "../../repositories/product.repository";
import { CreateProductDTO } from "../../dtos/product.dto";

export class ProductService {
  private repo = new ProductRepository();

  async createProduct(data: CreateProductDTO, image?: string) {
    return await this.repo.create({
      ...data,
      image,
    });
  }

  async getProducts() {
    return await this.repo.findAll();
  }

  async getOneProduct(id: string) {
    return await this.repo.findById(id);
  }

  async updateProduct(id: string, data: Partial<CreateProductDTO>) {
    return await this.repo.update(id, data);
  }

  async deleteProduct(id: string) {
    return await this.repo.delete(id);
  }
}
