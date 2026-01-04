import bcrypt from "bcryptjs";
import { UserRepository } from "../repositories/user.repository";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers() {
    return await this.userRepository.getAllUsers();
  }

  async getUserById(id: string) {
    return await this.userRepository.getUserById(id);
  }

  async updateUser(id: string, updateData: any) {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return await this.userRepository.updateUser(id, updateData);
  }

  async deleteUser(id: string) {
    return await this.userRepository.deleteUser(id);
  }
}
