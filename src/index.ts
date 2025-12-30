import express, { Application } from "express";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";

const app: Application = express();

async function startServer() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`);
  });
}
startServer();
