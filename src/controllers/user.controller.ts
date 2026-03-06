import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { toggleFavouriteDTO } from "../dtos/favourite.dto";
import { addToCartDTO } from "../dtos/cart.dto";
import { UserModel } from "../models/user.model";
import bcrypt from "bcryptjs";

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
    const result = await service.addToCart(req.params.userId, {
      productId,
      quantity,
      size,
    });
    res.json(result);
  }

  async updateCartItem(req: Request, res: Response) {
    const { productId, quantity, size } = req.body;
    const result = await service.updateCartItem(
      req.params.userId,
      productId,
      size,
      quantity,
    );
    res.json(result);
  }

  async removeCartItem(req: Request, res: Response) {
    const { productId, size } = req.body;
    const result = await service.removeCartItem(
      req.params.userId,
      productId,
      size,
    );
    res.json(result);
  }

  async clearCart(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      await UserModel.updateOne({ _id: userId }, { $set: { cart: [] } });

      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error) {
      console.error("Clear cart error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to clear cart",
      });
    }
  }

  async getCart(req: Request, res: Response) {
    const result = await service.getCart(req.params.userId);
    res.json(result);
  }
  async updateCustomer(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      const { email, password } = req.body;

      const updateData: any = {};

      if (email) updateData.email = email;

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await UserModel.updateOne({ _id: userId }, { $set: updateData });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  }
}
