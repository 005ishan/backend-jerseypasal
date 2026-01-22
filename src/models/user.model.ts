import mongoose, { Document, Schema } from "mongoose";
import { userType } from "../types/user.type";
const userSchema: Schema = new Schema<userType>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  }
);

export interface IUser extends userType, Document {
  _id: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", userSchema);
