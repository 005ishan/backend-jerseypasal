import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { createUserDTO, loginUserDTO } from "../dtos/user.dto";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import { JWT_SECRET } from "../config";

const userRepository = new UserRepository();

export class AuthService {
  async createUser(data: createUserDTO) {
    const existingUser = await userRepository.getUserByEmail(data.email);

    if (existingUser) {
      throw new HttpError(409, "Email already in use");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);
    data.password = hashedPassword;

    const newUser = await userRepository.createUser(data);

    // Remove password before returning
    const { password, ...safeUser } = newUser.toObject
      ? newUser.toObject()
      : newUser;

    return safeUser;
  }

  async loginUser(data: loginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const isPasswordValid = await bcryptjs.compare(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const payload = {
      _id: user._id, // IMPORTANT: matches req.user._id
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30d",
    });

    // Remove password before returning user
    const { password, ...safeUser } = user.toObject ? user.toObject() : user;

    return {
      token,
      user: safeUser,
    };
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);

    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const { password, ...safeUser } = user.toObject ? user.toObject() : user;

    return safeUser;
  }

  async updateUser(userId: string, data: Partial<any>) {
    const updatedUser = await userRepository.updateUser(userId, data);

    if (!updatedUser) {
      throw new HttpError(404, "User not found");
    }

    const { password, ...safeUser } = updatedUser.toObject
      ? updatedUser.toObject()
      : updatedUser;

    return safeUser;
  }
}
