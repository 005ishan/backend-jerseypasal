import dotenv from "dotenv";
dotenv.config();

export const PORT: number = process.env.PORT
  ? parseInt(process.env.PORT)
  : 5050;
export const MONGODB_URI: string =
  process.env.MONGODB_URI || "mongodb://localhost:27017/defaultdb";
//Application level constants, with fallbacks
//if .env variables are not set

export const JWT_SECRET: string = process.env.JWT_SECRET || "default";

// URL of the frontend application (used by CORS)
export const FRONTEND_URL: string = process.env.FRONTEND_URL || "http://localhost:5050";
