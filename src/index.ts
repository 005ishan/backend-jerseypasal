import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors"; 
import { connectDatabase } from "./database/mongodb";
import { PORT, FRONTEND_URL } from "./config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";

const app: Application = express();

// CORS MIDDLEWARE (IMPORTANT)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
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

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
