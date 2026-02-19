import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { toggleFavouriteDTO } from "../dtos/favourite.dto";
import { addToCartDTO } from "../dtos/cart.dto";

const service = new UserService();

export class UserController {
  async toggleFavourite(req: Request, res: Response) {
    const { productId } = toggleFavouriteDTO.parse(req.body);
    const result = await service.toggleFavourite(req.params.userId, productId);
    res.json(result);
  }

  async getFavourites(req: Request, res: Response) {
    const result = await service.getFavourites(req.params.userId);
    res.json(result);
  }

  async addToCart(req: Request, res: Response) {
    const { productId, quantity, size } = addToCartDTO.parse(req.body);
    const result = await service.addToCart(req.params.userId, { productId, quantity, size });
    res.json(result);
  }

  async updateCartItem(req: Request, res: Response) {
    const { productId, quantity, size } = req.body;
    const result = await service.updateCartItem(req.params.userId, productId, size, quantity);
    res.json(result);
  }

  async removeCartItem(req: Request, res: Response) {
    const { productId, size } = req.body;
    const result = await service.removeCartItem(req.params.userId, productId, size);
    res.json(result);
  }

  async getCart(req: Request, res: Response) {
    const result = await service.getCart(req.params.userId);
    res.json(result);
  }
}
