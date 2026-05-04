import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    CORS_ORIGIN: z.url().or(z.literal("*")),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number(),
    DATABASE_URL: z.string(),
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string(),
    ACCESS_TOKEN_EXPIRES: z.string(),
    REFRESH_TOKEN_EXPIRES: z.string(),
    BACKEND_URL: z.string(),
    FRONTEND_URL: z.string(),
    GITHUB_OAUTH_BROWSER_CLIENT_ID: z.string(),
    GITHUB_OAUTH_BROWSER_CLIENT_SECRET: z.string(),
    GITHUB_OAUTH_CLI_CLIENT_ID: z.string(),
    GITHUB_OAUTH_CLI_CLIENT_SECRET: z.string(),
    CLI_CALLBACK_URL: z.string()
  },
  clientPrefix: "PUBLIC_",
  client: {},
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
