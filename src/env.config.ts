import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
// set timezone to UTC
process.env.TZ = "UTC";

const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({
  path: path.resolve(dirname, `../.env.example`),
});

const DEFAULT_PORT = Number(process.env.PORT) || 3011;
const DEFAULT_HOST = NODE_ENV === "development" ? "localhost" : "0.0.0.0";
const HOST = process.env.HOST || DEFAULT_HOST;

export const ENV_CONFIG = {
  NODE_ENV,
  HOST,
  PORT: DEFAULT_PORT,
  JWT_SECRET: process.env.JWT_SECRET || "secret",
  DATABASE_URL: process.env.DATABASE_URL || "sqlite3.db",
} as const;
