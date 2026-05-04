import type { verifyAccessToken } from "@/misc/utils";

declare global {
  namespace Express {
    interface Request {
      user?: Awaited<ReturnType<typeof verifyAccessToken>>
    }
  }
}

export {};