import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/tests/**/*.test.ts"],
    poolOptions: {
      threads: { singleThread: true },
    },
    setupFiles: ["src/tests/helpers/setup.ts"],
  },
});
