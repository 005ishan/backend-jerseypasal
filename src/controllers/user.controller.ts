import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAllUsers = async (req: Request, res: Response) => {
    const users = await this.userService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  };

  getUserById = async (req: Request, res: Response) => {
    const user = await this.userService.getUserById(req.params.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  };

  updateUser = async (req: Request, res: Response) => {
    const updatedUser = await this.userService.updateUser(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  };

  deleteUser = async (req: Request, res: Response) => {
    const isDeleted = await this.userService.deleteUser(req.params.id);

    res.status(200).json({
      success: true,
      message: isDeleted
        ? "User deleted successfully"
        : "User not found",
    });
  };
}
