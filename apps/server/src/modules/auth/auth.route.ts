import {
  createRateLimiter,
  rateLimiterMiddleware,
  validateSchema,
} from "@/misc/utils";
import { githubCallbackSchema } from "@/schema/auth.schema";
import { Router } from "express";
import * as authController from "@/modules/auth/auth.controller";
import { authenticate } from "@/modules/auth/auth.middleware";
import { AppError } from "@/errors/app.error";
import { StatusCodes } from "http-status-codes";
import { minutesToSeconds } from "date-fns";

const router: Router = Router();

router.get(
  "/github",
  rateLimiterMiddleware(
    createRateLimiter({
      duration: minutesToSeconds(1),
      keyPrefix: "auth_",
      points: 10,
    }),
  ),
  async (req, res) => {
    const { state, code_challenge, code_challenge_method } = req.query;

    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_OAUTH_BROWSER_CLIENT_ID}&redirect_uri=${process.env.FRONTEND_URL}/auth/github/callback&state=${state}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}&scope=read:user,user:email`;

    // res.cookie("oauth_code_verifier", pkce.code_verifier, {
    //   httpOnly: false,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: isProduction ? "none" : "lax",
    //   maxAge: 10 * 60 * 1000,
    //   path: "/auth/github/callback",
    // });

    // res.cookie("oauth_state", state, {
    //   httpOnly: false,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: isProduction ? "none" : "lax",
    //   maxAge: 10 * 60 * 1000,
    //   path: "/auth/github/callback",
    // });

    res.redirect(githubUrl);
  },
);

router.get(
  "/github/callback",
  validateSchema(githubCallbackSchema, (req) => req.query),
  authController.loginUser,
);
// router.get("/me", authenticate, authController.getUserDetails);
router.post(
  "/refresh",
  // (req, res, next) => {
  //   const authHeader = req.headers.authorization;

  //   const token =
  //     (authHeader && authHeader.startsWith("Bearer ")
  //       ? authHeader.slice(7)
  //       : undefined) || req.cookies?.access_token;

  //   if (!token) {
  //     throw new AppError({
  //       message: "Missing access token",
  //       code: StatusCodes.UNAUTHORIZED,
  //     });
  //   }

  //   next();
  // },
  authController.refreshToken,
);
router.post("/logout", authenticate, authController.logout);

export default router;
