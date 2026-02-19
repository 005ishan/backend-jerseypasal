import mongoose, { Document, Schema, Types } from "mongoose";
import { userType } from "../types/user.type";

const favouriteSchema = new Schema({
  product: { type: Types.ObjectId, ref: "Product", required: true },
  addedAt: { type: Date, default: Date.now },
});

const cartSchema = new Schema({
  product: { type: Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: {
    type: String,
    enum: ["S", "M", "L", "XL", "XXL"],
    required: true,
  },
  addedAt: { type: Date, default: Date.now },
});

const userSchema: Schema = new Schema<userType>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    favourites: [favouriteSchema],
    cart: [cartSchema],
  },
  {
    timestamps: true,
  },
);

export interface IUser extends userType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", userSchema);
