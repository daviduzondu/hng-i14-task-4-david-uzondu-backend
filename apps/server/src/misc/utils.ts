import type { profileQuerySchema } from "@/schema/profile.schema";
import type z from "zod";
import parse from "compromise";
import countryCodeMapping from "@/lookup/country-code.lookup.json";
import profileQueryNlpMapping from "@/lookup/profile-query-nlp.lookup.json";
import type View from "compromise/view/one";
import { AppError } from "@/errors/app.error";
import jwt from "jsonwebtoken";
import type { Role } from "@/db/generated/types";
import { StatusCodes } from "http-status-codes";
import type { Request, Response, NextFunction } from "express";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import {
  RateLimiterPostgres,
  type IRateLimiterOptions,
} from "rate-limiter-flexible";
import { pool } from "@/db/pool";
import { millisecondsToSeconds, minutesToSeconds } from "date-fns";
import crypto from "node:crypto";

export const createRateLimiter = (options: IRateLimiterOptions) =>
  new RateLimiterPostgres({
    ...options,
    tableCreated: true,
    tableName: "rate_limit",
    dbName: "hngtask1",
    storeClient: pool,
  });

//  res.cookie('refreshToken', token, {
//     httpOnly: true,         // So JS would not be able to read this cookie
//     secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
//     sameSite: 'strict',     // CSRF protection
//     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
//     path: '/auth/refresh',
//   })

export const rateLimiterMiddleware =
  (rateLimiter: RateLimiterAbstract) =>
  (req: Request, res: Response, next: NextFunction) => {
    rateLimiter
      .consume(req.ip)
      .then(() => {
        next();
      })
      .catch(async (err) => {
        const rlRes = await rateLimiter.get(req.ip);
        res
          .set("Retry-After", String(millisecondsToSeconds(rlRes.msBeforeNext)))
          .status(StatusCodes.TOO_MANY_REQUESTS)
          .json({ status: "error", message: "Too Many Requests" });
      });
  };

export function validateSchema(
  schema: z.ZodType,
  getPayload: (r: Request<object, object, object, object>) => unknown,
) {
  return (
    req: Request<object, object, object, object>,
    _res: Response,
    next: NextFunction,
  ) => {
    const { error, data } = schema.safeParse(getPayload(req));
    if (error)
      throw new AppError({
        message: error.issues[0].message,
        code: StatusCodes.BAD_REQUEST,
      });
    return next();
  };
}

type Payload = { userId: string; role: Role; id?: string };
export function generateAccessToken(payload: Payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"],
  });
}
export function generateRefreshToken(payload: Payload & { jti: string }) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env
      .REFRESH_TOKEN_EXPIRES as jwt.SignOptions["expiresIn"],
  });
}
export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as jwt.JwtPayload &
    Payload;
}
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET) as jwt.JwtPayload &
    Payload;
}

export function parseSearchQuery(text: string) {
  const normalizedInput = text.toLowerCase();
  const doc = parse(normalizedInput);
  const youngMatch = doc.matchOne("young");
  const betweenMatch = doc.matchOne(
    "between (age| the age of | the ages of)?  [#Value] (and|to) [#Value]",
  );
  const countryMatch = countryCodeMapping.countries
    .map((c) => c.name)
    .find((c) => doc.has(c.toLowerCase()));
  const hasMatch = (values: string[]) =>
    values.some((v) => {
      return doc.clone().has(v);
    });

  const matchEnum = <T extends string>(map: Record<T, string[]>): T | null => {
    for (const [key, values] of Object.entries(map) as [T, string[]][]) {
      if (hasMatch(values)) return key;
    }
    return undefined;
  };

  const extractNumber = (patterns: string[]): number | null => {
    for (const pattern of patterns) {
      const match = doc.matchOne(pattern);
      if (match.found) {
        const num = match.matchOne("#Value").text();
        if (num) return parseFloat(num);
      }
    }
    return undefined;
  };

  return {
    gender: matchEnum(profileQueryNlpMapping.gender),
    country_id: countryMatch
      ? countryCodeMapping.countries.find((c) => c.name === countryMatch)?.code
      : undefined,
    age_group: youngMatch.found
      ? undefined
      : matchEnum(profileQueryNlpMapping.age_group),
    min_age: youngMatch.found
      ? 16
      : betweenMatch.found
        ? parseFloat((betweenMatch.groups("0") as View).text())
        : extractNumber(profileQueryNlpMapping.min_age),
    max_age: youngMatch.found
      ? 24
      : betweenMatch.found
        ? parseFloat((betweenMatch.groups("1") as View).text())
        : extractNumber(profileQueryNlpMapping.max_age),
    min_gender_probability: extractNumber(
      profileQueryNlpMapping.min_gender_probability,
    ),
    min_country_probability: extractNumber(
      profileQueryNlpMapping.min_country_probability,
    ),
    order: matchEnum(profileQueryNlpMapping.order),
    sort_by: matchEnum(profileQueryNlpMapping.sort_by),
  } satisfies z.infer<typeof profileQuerySchema>;
}

export type ErrorConstructor = new (...args: never[]) => Error;

type ErrorMap = Record<
  string,
  {
    errorClass: ErrorConstructor;
    message?: string;
    code?: number;
    getCode?: <T extends Error>(err: T) => number;
  }
>;

export async function catchAndThrowError<T>(
  fn: () => Promise<T>,
  errorMap: ErrorMap,
) {
  try {
    const result = await fn();
    return result;
  } catch (error) {
    console.error(error);
    for (const map of Object.values(errorMap)) {
      if (error instanceof map.errorClass) {
        const code =
          map.getCode && map?.getCode(error)
            ? map?.getCode(error)
            : (map.code ?? StatusCodes.INTERNAL_SERVER_ERROR);

        throw new AppError({
          message: error.message ?? map.message,
          code,
        });
      }
    }
    throw new Error("Something went wrong!", {
      cause: error,
    });
  }
}

export function makeGitHubHeaders(access_token: string) {
  return {
    Authorization: `Bearer ${access_token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function getQueryHash(obj: z.infer<typeof profileQuerySchema>) {
  const str = JSON.stringify(
    Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => (value !== null) || (value !== undefined))
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
  return crypto.createHash("sha256").update(str).digest("hex");
}

// const hasMatch = (values: string[]) =>
//  values.some(v => {
//   const plural = parse(v).nouns().toPlural().text()
//   return (
//    normalizedInput.includes(v) ||
//    (plural !== v && normalizedInput.includes(plural))
//   )
//  })
