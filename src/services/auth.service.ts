import jwt from "jsonwebtoken";
import { createUserDTO, loginUserDTO } from "../dtos/user.dto";
import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repository";
import bcryptjs from "bcryptjs";
import { JWT_SECRET } from "../config";

let userRepository = new UserRepository();

export class AuthService {
  async createUser(data: createUserDTO) {
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
      throw new HttpError(403, "Email already in use");
    }
    // hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10); // 10 - complexity
    data.password = hashedPassword;
    const newUser = await userRepository.createUser(data);
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
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" }); // 30 days
    return { token, user };
  }
}
