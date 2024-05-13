import * as bcryptjs from "bcryptjs";
import { router, trpcError, protectedProcedure } from "../../trpc/core";
import * as schema from "../../db/schema";
import db from "../../db/client";
import { and, eq, gte } from "drizzle-orm";
import { clearTokens } from "../auth/model";
import { z } from "zod";

export const account = router({
  me: protectedProcedure.query(async ({ ctx: { user } }) => {
    const { userId } = user;
    const targetUser = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!targetUser) {
      throw new trpcError({
        code: "NOT_FOUND",
      });
    }
    return {
      ...targetUser,
    };
  }),
  passwordChange: protectedProcedure
    .input(z.object({ password: z.string(), newPassword: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { password, newPassword } = input;
      const targetUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      if (!targetUser || !targetUser.hashedPassword) {
        throw new trpcError({
          code: "NOT_FOUND",
        });
      }
      const isPasswordCorrect = await bcryptjs.compare(
        password,
        targetUser.hashedPassword
      );
      if (!isPasswordCorrect) {
        throw new trpcError({
          code: "BAD_REQUEST",
        });
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      db.update(schema.users)
        .set({
          hashedPassword,
        })
        .where(eq(schema.users.id, userId));
      return {
        success: true,
      };
    }),
  emailChangeRequest: protectedProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { email, password } = input;
      const emailNormalized = email.toLowerCase();
      const targetUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      if (!targetUser || !targetUser.hashedPassword) {
        throw new trpcError({
          code: "NOT_FOUND",
        });
      }
      const isPasswordCorrect = await bcryptjs.compare(
        password,
        targetUser.hashedPassword
      );
      if (!isPasswordCorrect) {
        throw new trpcError({
          code: "BAD_REQUEST",
        });
      }
      // create random otp code
      const otpCode = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      // create change request record
      db.insert(schema.emailChangeRequests).values({
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        otpCode,
        newEmail: emailNormalized,
      });
      // notify user
      // await notify({
      //   eventType: "emailChangeOtp",
      //   channels: ["mail"],
      //   data: {
      //     otpCode,
      //     userName: targetUser.name,
      //   },
      //   user: {
      //     email: emailNormalized,
      //     locale: targetUser.locale as Language,
      //   },
      // });
      return {
        success: true,
      };
    }),
  emailChangeVerify: protectedProcedure
    .input(z.object({ otpCode: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { otpCode } = input;
      const targetUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      if (!targetUser) {
        throw new trpcError({
          code: "NOT_FOUND",
        });
      }
      const timeBefore10mins = new Date(Date.now() - 1000 * 60 * 10);
      const targetChangeRequest = await db.query.emailChangeRequests.findFirst({
        where: and(
          eq(schema.emailChangeRequests.userId, userId),
          eq(schema.emailChangeRequests.otpCode, otpCode),
          gte(schema.emailChangeRequests.createdAt, timeBefore10mins)
        ),
      });
      if (!targetChangeRequest) {
        throw new trpcError({
          code: "BAD_REQUEST",
        });
      }
      // update user email
      db.update(schema.users)
        .set({
          email: targetChangeRequest.newEmail,
        })
        .where(eq(schema.users.id, userId));
      // return
      return {
        success: true,
      };
    }),
  generalDetailsChangeRequest: protectedProcedure
    .input(z.object({ locale: z.string(), timezone: z.string() }))
    .mutation(async ({ ctx: { user }, input }) => {
      const { userId } = user;
      const { locale, timezone } = input;
      const targetUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      if (!targetUser) {
        throw new trpcError({
          code: "NOT_FOUND",
        });
      }
      db.update(schema.users)
        .set({
          locale,
          timezone,
        })
        .where(eq(schema.users.id, userId));
      return {
        success: true,
      };
    }),
  logout: protectedProcedure.mutation(({ ctx: { res } }) => {
    clearTokens({ res });
    return {
      success: true,
    };
  }),
});
