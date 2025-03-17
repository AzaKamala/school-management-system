import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";

const apiLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
  blockDuration: 60 * 15,
});

export function rateLimitAPI(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || "unknown";

  apiLimiter
    .consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      res
        .status(429)
        .json({ error: "Too many requests, please try again later" });
    });
}

export function rateLimitLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const email = req.body.email || "unknown";
  const key = `${req.ip}_${email}`;

  loginLimiter
    .consume(key)
    .then(() => {
      next();
    })
    .catch((rejRes) => {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set("Retry-After", String(secs));
      res.status(429).json({
        error: "Too many login attempts, please try again later",
        retryAfter: secs,
      });
    });
}
