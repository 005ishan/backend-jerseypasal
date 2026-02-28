import mongoose, { Document, Schema, Types } from "mongoose";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export interface IOrder extends Document {
  userId: Types.ObjectId;
  transactionId: string;
  items: {
    productId: Types.ObjectId;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionId: { type: String, required: true },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: { type: String, required: true },
        size: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
        imageUrl: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
