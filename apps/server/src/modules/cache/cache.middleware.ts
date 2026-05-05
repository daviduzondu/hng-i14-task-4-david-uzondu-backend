import { redis } from "@/app";
import type { Request, Response, NextFunction } from "express";

export function cache(ttlSeconds = 60, getKey?: (r: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `cache:${getKey(req) ? getKey(req) : req.originalUrl}`;

    // 1. check cache
    const cached = await redis.get(key);

    if (cached) {
      console.log("Resource found in cache!", key);
      return res.json(JSON.parse(cached));
    }

    // 2. hook into response to store result
    const originalJson = res.json.bind(res); // <-- Take res.json, but permanently lock this to res.

    res.json = (body) => {
      redis.setex(key, ttlSeconds, JSON.stringify(body));
      return originalJson(body);
    };

    next();
  };
}
