import jwt from "jsonwebtoken";
import { ENV_CONFIG } from "../../env.config";
import { setCookie, clearCookie, getCookie } from "./internals/cookies";
import type { FastifyReply, FastifyRequest } from "fastify";
import { trpcError } from "../../trpc/core";
const jwtSecret = ENV_CONFIG.JWT_SECRET;

type MyJwtPayload = {
  userId: number;
};

export const verifyRefreshToken = ({ req }: { req: FastifyRequest }) => {
  const refreshToken = getCookie({ req, name: "refreshToken" }) as string;
  return jwt.verify(refreshToken, jwtSecret) as MyJwtPayload;
};

export const verifyAccessToken = ({ req }: { req: FastifyRequest }) => {
  const accessToken = getCookie({ req, name: "accessToken" });
  if (accessToken === undefined) {
    throw new trpcError({
      code: "UNAUTHORIZED",
    });
  }
  return jwt.verify(accessToken, jwtSecret) as MyJwtPayload;
};

export const setTokens = ({
  res,
  payload,
}: {
  res: FastifyReply;
  payload: MyJwtPayload;
}) => {
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign(payload, jwtSecret, {
    expiresIn: "30d",
  });
  setCookie({
    res,
    name: "accessToken",
    value: accessToken,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  setCookie({
    res,
    name: "refreshToken",
    value: refreshToken,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
};

export const clearTokens = ({ res }: { res: FastifyReply }) => {
  clearCookie({
    res,
    name: "accessToken",
  });
  clearCookie({
    res,
    name: "refreshToken",
  });
};

export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
