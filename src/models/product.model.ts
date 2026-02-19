import mongoose, { Schema, Document } from "mongoose";
import { JerseyCategory } from "../types/common.type";

export interface IProduct extends Document {
  name: string;
  price: number;
  imageUrl?: string;
  category: JerseyCategory;
  sizes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["club", "country"],
      required: true,
    },
    sizes: [{ type: String }],
    imageUrl: { type: String },
  },
  { timestamps: true },
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
