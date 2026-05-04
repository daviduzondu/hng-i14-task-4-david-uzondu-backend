import { Role } from "@/db/generated/types";
import { AppError } from "@/errors/app.error";
import { catchAndThrowError, verifyAccessToken } from "@/misc/utils";
import { getUserActiveState } from "@/modules/auth/auth.repository";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  const token =
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined) || req.cookies?.access_token;

  if (!token)
    throw new AppError({
      message: "Missing access token",
      code: StatusCodes.UNAUTHORIZED,
    });

  return await catchAndThrowError(
    async () => {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    },
    {
      jwtError: {
        errorClass: jwt.JsonWebTokenError,
        getCode(err) {
          if (err instanceof jwt.TokenExpiredError) {
            return StatusCodes.UNAUTHORIZED;
          } else {
            return StatusCodes.BAD_REQUEST;
          }
        },
        message: "Failed to verify token",
      },
    },
  );
}

export function authorize(roles: Role[]) {
  return (
    req: Request<object, object, object, object>,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!roles.includes(req.user?.role)) {
      console.log(roles);
      throw new AppError({
        message: "Insufficient permissions. You must be signed in as an admin",
        code: StatusCodes.FORBIDDEN,
      });
    }
    return next();
  };
}

export async function isActive(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const userId = req.user.userId;
  const activeState = await getUserActiveState(userId);
  if (!activeState.is_active)
    throw new AppError({
      message: "This user is not active",
      code: StatusCodes.FORBIDDEN,
    });
  return next();
}
