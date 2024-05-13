import { beforeAll, describe, expect, it } from "vitest";
import { db, schema } from "../../db/client";
import { createAuthenticatedCaller, createCaller } from "../helpers/utils";
import resetDb from "../helpers/resetDb";
import { eq } from "drizzle-orm";

describe("account routes", async () => {
  beforeAll(async () => {
    await resetDb();
  });

  describe("me", async () => {
    const user = {
      email: "mail@mail.com",
      password: "P@ssw0rd",
      name: "test",
      timezone: "Asia/Riyadh",
      locale: "en",
    };
    it("should return the current user", async () => {
      await createCaller({}).auth.register(user);
      const userInDb = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      });
      const userProfile = await createAuthenticatedCaller({
        userId: userInDb!.id,
      }).account.me();
      expect(userProfile.email).toBe(user.email);
      expect(userProfile.name).toBe(user.name);
      expect(userProfile.id).toBe(userInDb!.id);
    });
  });
});
