import type { Config } from "drizzle-kit";
import { ENV_CONFIG } from "./src/env.config";
export default {
  strict: true,
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  driver: "better-sqlite",
  dbCredentials: {
    url: ENV_CONFIG.DATABASE_URL,
  },
} satisfies Config;
