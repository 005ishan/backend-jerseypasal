import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { connectDatabase } from "./database/mongodb";
import { PORT, FRONTEND_URL } from "./config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/admin/user.route";
import path from "path";
import { HttpError } from "./errors/http-error";

const app: Application = express();

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:3005",
  ],
  optionsSuccessStatus: 200,
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to the API",
  });
});

// Provide a root for `/api` so frontend baseURL at `/api` can check status
app.get("/api", (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "API root",
    status: "ok",
  });
});

app.use((err: Error, req: Request, res: Response, next: Function) => {
  if (err instanceof HttpError) {
    return res
      .status(err.statusCode)
      .json({ success: false, message: err.message });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Internal Server Error" });
});

export default app;
