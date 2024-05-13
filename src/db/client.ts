import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ENV_CONFIG } from "../env.config";
import Database from "better-sqlite3";

export const sqlite = new Database(ENV_CONFIG.DATABASE_URL, {
  verbose: console.log,
});
sqlite.pragma("journal_mode = WAL");

// for query purposes
const db = drizzle(sqlite, { schema });

export { db, schema };
export default db;
