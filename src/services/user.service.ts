import { createUserDTO, loginUserDTO } from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { HttpError } from "../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { IUser } from "../models/user.model";
import { sendEmail } from "../config/email";

const CLIENT_URL = process.env.CLIENT_URL as string;

let userRepository = new UserRepository();

export class UserService {
  async createUser(data: createUserDTO) {
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
      throw new HttpError(403, "Email already in use");
    }

    // hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10);

    const userData: Partial<IUser> = {
      email: data.email,
      password: hashedPassword,
      role: data.role ?? "user",
    };

    const newUser = await userRepository.createUser(userData);
    return newUser;
  }

  async loginUser(data: loginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    // compare password
    const validPassword = await bcryptjs.compare(data.password, user.password);
    // plaintext, hashed
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }
    // generate jwt
    const payload = {
      // user identifier
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" }); // 30 days
    return { token, user };
  }

  async getAllUsers(
        page?: string, size?: string, search?: string
    ){
        const pageNumber = page ? parseInt(page) : 1;
        const pageSize = size ? parseInt(size) : 10;
        const {users, total} = await userRepository.getAllUsers(
            pageNumber, pageSize, search
        );
        const pagination = {
            page: pageNumber,
            size: pageSize,
            totalItems: total,
            totalPages: Math.ceil(total / pageSize)
        }
        return {users, pagination};
    }

  async getUserById(id: string) {
    try {
      if (!id) {
        throw new HttpError(400, "User ID is required");
      }
      const user = await userRepository.getUserById(id);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      return user;
    } catch (error: Error | any) {
      throw new HttpError(
        error.statusCode ?? 500,
        error.message || "Failed to fetch user",
      );
    }
  }

  async deleteUser(id: string) {
    try {
      if (!id) {
        throw new HttpError(400, "User ID is required");
      }
      const user = await userRepository.getUserById(id);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const deletedUser = await userRepository.deleteUser(id);
      return deletedUser;
    } catch (error: Error | any) {
      throw new HttpError(
        error.statusCode ?? 500,
        error.message || "Failed to delete user",
      );
    }
  }
  async updateUser(id: string, data: Partial<createUserDTO>) {
    try {
      if (!id) throw new HttpError(400, "User ID is required");

      const user = await userRepository.getUserById(id);
      if (!user) throw new HttpError(404, "User not found");

      // Check email uniqueness
      if (data.email && data.email !== user.email) {
        const emailCheck = await userRepository.getUserByEmail(data.email);
        if (emailCheck) throw new HttpError(403, "Email already in use");
      }

      // Map DTO to IUser-compatible object
      const updateData: Partial<IUser> = {
        email: data.email,
        role: data.role ?? user.role,
      };

      // Hash password if provided
      if (data.password) {
        updateData.password = await bcryptjs.hash(data.password, 10);
      }

      const updatedUser = await userRepository.updateUser(id, updateData);
      return updatedUser;
    } catch (error: any) {
      throw new HttpError(
        error.statusCode ?? 500,
        error.message || "Failed to update user",
      );
    }
  }
  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    await sendEmail(user.email, "Password Reset", html);
    return user;
  }
}
