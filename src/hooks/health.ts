import type { FastifyPluginCallback } from "fastify";
import { db } from "../db/client";
import { sql } from "drizzle-orm";

export const healthRouter: FastifyPluginCallback = (fastify, options, done) => {
  fastify.get("/", async () => {
    return { status: "ok" };
  });
  fastify.get("/db", async () => {
    const queryResult = await db.run(sql`SELECT 1 + 1 as "onePlusOne"`);
    return { status: "ok", queryResult };
  });
  done();
};
