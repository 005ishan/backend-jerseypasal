import { Request, Response } from "express";
import { TransactionModel } from "../models/transaction.model";
import { UserModel } from "../models/user.model";

export class TransactionController {
  async getUserTransactions(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const transactions = await TransactionModel.find({
        userId,
      }).sort({ createdAt: -1 });
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch transactions",
      });
    }
  }

  async paymentSuccess(req: Request, res: Response) {
    try {
      const { userId, productName, amount, paymentMethod } = req.body;

      const transactionId = Date.now().toString();

      const transaction = await TransactionModel.create({
        userId,
        productName,
        amount,
        paymentMethod,
        transactionId,
      });

      await UserModel.updateOne({ _id: userId }, { $set: { cart: [] } });

      return res.json({ success: true, transaction });
    } catch (error) {
      return res.status(500).json({ message: "Payment failed" });
    }
  }

  async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await TransactionModel.find();

      return res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
      });
    }
  }
}