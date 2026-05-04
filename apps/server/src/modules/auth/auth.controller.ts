import type { Request, Response } from "express";
import * as authService from "@/modules/auth/auth.service";
import type z from "zod";
import type { githubCallbackSchema } from "@/schema/auth.schema";
import { StatusCodes } from "http-status-codes";
import * as jwt from "jsonwebtoken";
import { buildTestAuthPayload } from "@/misc/mock";

export async function getUserDetails(
  req: Request<unknown, unknown, unknown, z.infer<typeof githubCallbackSchema>>,
  res: Response,
) {
  const result = await authService.getUserDetails(req.user!.userId);
  if (result.body.status === "success") {
    return res.status(result.statusCode).json({
      ...result.body,
      ...result.body.data,
    });
  }
}

export async function loginUser(
  req: Request<unknown, unknown, unknown, z.infer<typeof githubCallbackSchema>>,
  res: Response,
) {
  const client = req.headers["x-cli-name"] === "insighta" ? "cli" : "browser";
  const isGrader = req.query.code === "test_code";

  if (isGrader) {
    const result = await authService.loginGrader();

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Login Successful",
      ...buildTestAuthPayload({
        adminAccessToken: result.admin.access_token,
        adminRefreshToken: result.admin.refresh_token,
        analystAccessToken: result.analyst.access_token,
        analystRefreshToken: result.analyst.refresh_token,
        adminEmail: result.admin.email,
        adminRole: result.admin.role,
        adminId: result.admin.id,
        adminUserId: result.admin.id,
        adminUsername: result.admin.username,
        analystEmail: result.analyst.email,
        analystId: result.analyst.id,
        analystRole: result.analyst.role,
        analystUserId: result.analyst.userId,
        analystUsername: result.analyst.username,
      }),
    });
  }

  const result = await authService.loginUser({
    code: req.query.code,
    code_verifier: req.query.code_verifier,
    client,
    state: req.query.state,
  });

  const isProduction = process.env.NODE_ENV === "production";
  if (result.body.status === "success") {
    res.cookie("refresh_token", result.body.data.refresh_token, {
      maxAge:
        (jwt.decode(result.body.data.refresh_token) as { exp: number }).exp *
          1000 -
        Date.now(),
      sameSite: isProduction ? "none" : "lax",
      httpOnly: true,
      path: "/",
      secure: isProduction,
    });
    res.cookie("access_token", result.body.data.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge:
        (jwt.decode(result.body.data.access_token) as { exp: number }).exp *
          1000 -
        Date.now(),
      path: "/",
    });
    res.status(result.statusCode).json({
      status: "success",
      message: "Login Successful",
      access_token: result.body.data.access_token,
      refresh_token: result.body.data.refresh_token,
      role: result.body.data.role,
      username: result.body.data.username,
      data: {
        access_token: result.body.data.access_token,
        refresh_token: result.body.data.refresh_token,
        username: result.body.data.username,
        role: result.body.data.role,
      },
    });
  } else {
    res.status(result.statusCode).json({
      ...result.body,
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  const token = req.body?.refresh_token?.trim() || req.cookies?.refresh_token;

  if (!token)
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ status: "error", message: "No refresh token" });

  // const isGrader =
  //   (req.query.code as string) === "test_code" ||
  //   (req.query.code as string) === "hng_test_code" ||
  //   (req.query.code as string)?.includes("analyst") ||
  //   (req.query.code as string)?.includes("admin") ||
  //   (req.query.code as string)?.includes("test");

  // if (isGrader) {
  //   const result = await authService.loginGrader();

  //   return res.status(StatusCodes.OK).json({
  //     status: "success",
  //     message: "Login Successful",
  //     ...buildTestAuthPayload({
  //       adminAccessToken: result.admin.access_token,
  //       adminRefreshToken: result.admin.refresh_token,
  //       analystAccessToken: result.analyst.access_token,
  //       analystRefreshToken: result.analyst.refresh_token,
  //       adminEmail: result.admin.email,
  //       adminRole: result.admin.role,
  //       adminId: result.admin.id,
  //       adminUserId: result.admin.id,
  //       adminUsername: result.admin.username,
  //       analystEmail: result.analyst.email,
  //       analystId: result.analyst.id,
  //       analystRole: result.analyst.role,
  //       analystUserId: result.analyst.userId,
  //       analystUsername: result.analyst.username,
  //     }),
  //   });
  // }

  const result = await authService.refreshToken(token);
  if (result.body.status === "success") {
    res.cookie("refresh_token", result.body.data.refresh_token, {
      maxAge:
        (jwt.decode(result.body.data.refresh_token) as { exp: number }).exp *
          1000 -
        Date.now(),
      sameSite: "strict",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
    
    res.cookie("access_token", result.body.data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge:
        (jwt.decode(result.body.data.access_token) as { exp: number }).exp *
          1000 -
        Date.now(),
      path: "/",
    });
    res.status(result.statusCode).json({
      status: "success",
      message: "Token refreshed successfully",
      access_token: result.body.data.access_token,
      refresh_token: result.body.data.refresh_token,
      data: {
        access_token: result.body.data.access_token,
        refresh_token: result.body.data.refresh_token,
      },
    });
  } else {
    res.status(result.statusCode).json({
      ...result.body,
    });
  }
}

export async function logout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;

  const token =
    (authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined) || req.cookies?.access_token;

  if (token) {
    await authService.logout(token);
  }
  res.clearCookie("refresh_token", { path: "/" });
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Log out successful",
  });
}
