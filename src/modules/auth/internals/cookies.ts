import type { FastifyReply, FastifyRequest } from "fastify";
import { ENV_CONFIG } from "../../../env.config";

const cookieNamePrefix = "";
const domainAsObj =
  ENV_CONFIG.NODE_ENV === "production" || ENV_CONFIG.NODE_ENV === "staging"
    ? { domain: ".jdwly.com" }
    : {};

export const setCookie = ({
  res,
  name,
  value,
  maxAge,
}: {
  res: FastifyReply;
  name: string;
  value: string;
  maxAge: number;
}) => {
  console.log(domainAsObj);
  res.setCookie(`${cookieNamePrefix}${name}`, value, {
    httpOnly: true,
    path: "/",
    maxAge,
    ...domainAsObj,
  });
};

export const clearCookie = ({
  res,
  name,
}: {
  res: FastifyReply;
  name: string;
}) => {
  res.clearCookie(`${cookieNamePrefix}${name}`, {
    httpOnly: true,
    path: "/",
    ...domainAsObj,
  });
};

export const getCookie = ({
  req,
  name,
}: {
  req: FastifyRequest;
  name: string;
}) => {
  const cookie = req.cookies[`${cookieNamePrefix}${name}`];
  return cookie;
};
