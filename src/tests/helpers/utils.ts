import { eq } from "drizzle-orm";
import { db, schema } from "../../db/client";
import { ENV_CONFIG } from "../../env.config";
import { createCallerFactory } from "../../trpc/core";
import { appRouter } from "../../trpc/router";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

interface FastifyRequestWithCookie extends FastifyRequest {
  cookies: { [cookieName: string]: string | undefined };
}
const jwtSecret = ENV_CONFIG.JWT_SECRET;
export const createCaller = (
  (appRouter) =>
  ({
    req,
    res,
  }: {
    req?: Partial<FastifyRequestWithCookie>;
    res?: FastifyReply | object;
  }) => {
    const caller = createCallerFactory(appRouter);
    return caller({ req: req as FastifyRequest, res: res as FastifyReply });
  }
)(appRouter);

export const createAuthenticatedCaller = ({ userId }: { userId: number }) => {
  const accessToken = jwt.sign({ userId }, jwtSecret);
  return createCaller({
    req: { cookies: { accessToken } },
    res: { setCookie: () => {} },
  });
};

type User = {
  email: string;
  password: string;
  name: string;
  timezone: string;
  locale: string;
};
export const setupUser = async (user: User) => {
  //register user
  await createCaller({}).auth.register(user);
  const userInDb = await db.query.users.findFirst({
    where: eq(schema.users.email, user.email),
  });

  //create authenticated caller
  const authenticatedUser = createAuthenticatedCaller({
    userId: userInDb!.id,
  });

  //get OTP form db to verify User
  const verifyRequest = await db.query.emailVerifications.findFirst({
    where: eq(schema.emailVerifications.email, user.email),
  });

  //verify user
  const { teamId } = await authenticatedUser.auth.emailVerifySubmit({
    email: user.email,
    otpCode: verifyRequest!.otpCode,
  });

  return { teamId, calendarSlug: authenticatedUser };
};
