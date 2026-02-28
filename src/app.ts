import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDatabase } from "./database/mongodb";
import { PORT, FRONTEND_URL } from "./config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/admin/user.route";
import userRoutess from "./routes/user.route";
import path from "path";
import { HttpError } from "./errors/http-error";
import productRoutes from "./routes/admin/product.route";
import transactionRouter from "./routes/transaction.route";
import orderRoutes from "./routes/order.route";
import adminOrderRoutes from "./routes/admin/order.route";
import paymentRoutes from "./routes/payment.route";

const app: Application = express();

/*
=================================================
CORS CONFIG
=================================================
*/
const corsOptions = {
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: true,
};

app.use(cors(corsOptions));

/*
=================================================
BODY PARSER (IMPORTANT)
Use Express built-in parser
=================================================
*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
=================================================
STATIC FILES
=================================================
*/
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

/*
=================================================
DATABASE CONNECTION
=================================================
*/
connectDatabase();

/*
=================================================
ROUTES
=================================================
*/
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/users", userRoutess);
app.use("/admin/products", productRoutes);
app.use("/api/transactions", transactionRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/payment", paymentRoutes);

/*
=================================================
ROOT TEST ROUTES
=================================================
*/
app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to the API",
  });
});

app.get("/api", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "API root",
    status: "ok",
  });
});

/*
=================================================
GLOBAL ERROR HANDLER
=================================================
*/
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
