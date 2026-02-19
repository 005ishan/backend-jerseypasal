import { QueryFilter, Types } from "mongoose";
import { UserModel, IUser } from "../models/user.model";
import { AddToCartDTO } from "../dtos/cart.dto";
import { CartItemType, FavouriteItemType } from "../types/user.type";
export interface IUserRepository {
  getUserByEmail(email: string): Promise<IUser | null>;
  createUser(userData: Partial<IUser>): Promise<IUser>;
  getUserById(id: string): Promise<IUser | null>;
  getAllUsers(
    page: number,
    size: number,
    search?: string,
  ): Promise<{ users: IUser[]; total: number }>;
  updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null>;
  deleteUser(id: string): Promise<boolean>;

  toggleFavourite(userId: string, productId: string): Promise<any>;
  addToCart(userId: string, data: AddToCartDTO): Promise<any>;
}
export class UserRepository implements IUserRepository {
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new UserModel(userData);
    return await user.save();
  }
  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email: email });
    return user;
  }
  async getUserById(id: string): Promise<IUser | null> {
    // UserModel.findOne({ "_id": id });
    const user = await UserModel.findById(id);
    return user;
  }
  async getAllUsers(
    page: number,
    size: number,
    search?: string,
  ): Promise<{ users: IUser[]; total: number }> {
    const filter: QueryFilter<IUser> = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }
    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .skip((page - 1) * size)
        .limit(size),
      UserModel.countDocuments(filter),
    ]);
    return { users, total };
  }
  async updateUser(
    id: string,
    updateData: Partial<IUser>,
  ): Promise<IUser | null> {
    return await UserModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteUser(id: string): Promise<boolean> {
    // UserModel.deleteOne({ _id: id });
    const result = await UserModel.findByIdAndDelete(id);
    return result ? true : false;
  }
  async toggleFavourite(userId: string, productId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    const exists = user.favourites.find(
      (f) => f.product.toString() === productId,
    );

    if (exists) {
      user.favourites = user.favourites.filter(
        (f) => f.product.toString() !== productId,
      );
    } else {
      user.favourites.push({
        product: productId,
        addedAt: new Date(),
      });
    }

    await user.save();
    return user.favourites;
  }

  async getFavourites(userId: string): Promise<FavouriteItemType[]> {
    const user =
      await UserModel.findById(userId).populate("favourites.product");
    if (!user) throw new Error("User not found");
    return user.favourites;
  }

  async addToCart(userId: string, data: any) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    const existing = user.cart.find(
      (item) =>
        item.product.toString() === data.productId && item.size === data.size,
    );

    if (existing) {
      existing.quantity += data.quantity;
    } else {
      user.cart.push({
        product: data.productId,
        quantity: data.quantity,
        size: data.size,
        addedAt: new Date(),
      });
    }

    await user.save();
    return user.cart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    size: string,
    quantity: number,
  ): Promise<CartItemType[]> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    const item = user.cart.find(
      (item) => item.product.toString() === productId && item.size === size,
    );

    if (item) {
      item.quantity = quantity;
      await user.save();
    }

    return user.cart.map((i) => ({
      product: i.product.toString(),
      quantity: i.quantity,
      size: i.size,
      addedAt: i.addedAt,
    }));
  }

  async removeCartItem(
    userId: string,
    productId: string,
    size: string,
  ): Promise<CartItemType[]> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    user.cart = user.cart.filter(
      (item) => !(item.product.toString() === productId && item.size === size),
    );

    await user.save();

    return user.cart.map((i) => ({
      product: i.product.toString(),
      quantity: i.quantity,
      size: i.size,
      addedAt: i.addedAt,
    }));
  }

  async getCart(userId: string): Promise<CartItemType[]> {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("User not found");

    return user.cart.map((i) => ({
      product: i.product.toString(),
      quantity: i.quantity,
      size: i.size,
      addedAt: i.addedAt,
    }));
  }
}
