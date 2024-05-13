import { beforeAll } from "vitest";
import resetDb from "./resetDb";

beforeAll(async () => {
  await resetDb();
});
