import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { createUserDTO, loginUserDTO, updateUserDTO } from "../dtos/user.dto";
import z from "zod";

interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const parsed = createUserDTO.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const user = await authService.createUser(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Registered successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsed = loginUserDTO.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const { token, user } = await authService.loginUser(parsed.data);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: user,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const user = await authService.getUserById(userId);

      return res.status(200).json({
        success: true,
        message: "User profile fetched successfully",
        data: user,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const parsed = updateUserDTO.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const updateData = parsed.data;

      if (req.file) {
        updateData.imageUrl = `/uploads/${req.file.filename}`;
      }

      const updatedUser = await authService.updateUser(userId, updateData);

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
