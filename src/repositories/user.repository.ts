import { QueryFilter } from "mongoose";
import { UserModel, IUser } from "../models/user.model";
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
}
