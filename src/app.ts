import fastify from "fastify";
import cors from "@fastify/cors";
import type { FastifyCookieOptions } from "@fastify/cookie";
import cookie from "@fastify/cookie";
import {
  fastifyTRPCPlugin,
  type FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";
import { ENV_CONFIG } from "./env.config";
// import { startSqsConsumers } from "./sqs";

const server = fastify({
  maxParamLength: 5000,
  logger: { level: "debug" },
});
server.addHook("onRoute", (opts) => {
  if (opts.path === "/health") {
    opts.logLevel = "silent";
  }
});

server.register(cookie, {
  secret: "some-secret", // for cookies signature
  parseOptions: {}, // options for parsing cookies
} as FastifyCookieOptions);

server.register(cors, {
  origin: (origin, cb) => {
    if (ENV_CONFIG.NODE_ENV !== "production") {
      return cb(null, true);
    } else {
      return origin!.endsWith("jdwly.com") ? cb(null, true) : cb(null, false);
    }
  },
  credentials: true,
});

type AppRouter = typeof appRouter;
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      // report to error monitoring
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`Error in tRPC handler on path '${path}':`, error);
      }
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

import { healthRouter } from "./hooks/health";
server.register(healthRouter, { prefix: "/health" });

const host = ENV_CONFIG.HOST;
const port = ENV_CONFIG.PORT;
(async () => {
  try {
    // await startSqsConsumers();
    await server.listen({ host, port });
    console.info(`🚀 Fastify server ready!`);
    if (ENV_CONFIG.NODE_ENV === "development") {
      console.table({
        host,
        port,
        NODE_ENV: ENV_CONFIG.NODE_ENV,
      });
    } else {
      console.table({
        port,
        NODE_ENV: ENV_CONFIG.NODE_ENV,
      });
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
