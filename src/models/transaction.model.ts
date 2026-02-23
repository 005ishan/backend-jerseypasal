import { Schema, model } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: String, required: true },
    productName: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["esewa", "khalti"], required: true },
    status: { type: String, default: "success" },
    transactionId: { type: String, required: true },
  },
  { timestamps: true }
);

export const TransactionModel = model(
  "Transaction",
  TransactionSchema
);