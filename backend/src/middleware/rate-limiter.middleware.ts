import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  firstRequest: Date;
  lastRequest: Date;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 5, // Maximum requests per window
  windowMs: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  baseDelay: 1000, // Base delay in milliseconds (1 second)
  maxDelay: 60000, // Maximum delay in milliseconds (1 minute)
};

/**
 * Rate limiter middleware with exponential backoff
 * Limits users to 5 interview generations per 24 hours
 */
export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = new Date();
    const key = `interview_gen:${userId}`;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry) {
      // First request for this user
      entry = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    // Check if window has expired
    const timeSinceFirstRequest = now.getTime() - entry.firstRequest.getTime();
    if (timeSinceFirstRequest > RATE_LIMIT_CONFIG.windowMs) {
      // Reset the window
      entry = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      };
      rateLimitStore.set(key, entry);
      return next();
    }

    // Check if rate limit exceeded
    if (entry.count >= RATE_LIMIT_CONFIG.maxRequests) {
      const timeUntilReset = RATE_LIMIT_CONFIG.windowMs - timeSinceFirstRequest;
      const resetTime = new Date(now.getTime() + timeUntilReset);

      return res.status(429).json({
        message: `Rate limit exceeded. You have reached the maximum of ${RATE_LIMIT_CONFIG.maxRequests} interview generations per 24 hours.`,
        retryAfter: Math.ceil(timeUntilReset / 1000), // seconds
        resetAt: resetTime.toISOString(),
        limit: RATE_LIMIT_CONFIG.maxRequests,
        remaining: 0,
      });
    }

    // Calculate exponential backoff delay
    const timeSinceLastRequest = now.getTime() - entry.lastRequest.getTime();
    const requiredDelay = Math.min(
      RATE_LIMIT_CONFIG.baseDelay * Math.pow(2, entry.count - 1),
      RATE_LIMIT_CONFIG.maxDelay
    );

    // Check if user is making requests too quickly
    if (timeSinceLastRequest < requiredDelay) {
      const waitTime = requiredDelay - timeSinceLastRequest;
      return res.status(429).json({
        message: "Too many requests. Please slow down.",
        retryAfter: Math.ceil(waitTime / 1000), // seconds
        limit: RATE_LIMIT_CONFIG.maxRequests,
        remaining: RATE_LIMIT_CONFIG.maxRequests - entry.count,
      });
    }

    // Update entry
    entry.count += 1;
    entry.lastRequest = now;
    rateLimitStore.set(key, entry);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_CONFIG.maxRequests);
    res.setHeader("X-RateLimit-Remaining", RATE_LIMIT_CONFIG.maxRequests - entry.count);
    res.setHeader("X-RateLimit-Reset", new Date(entry.firstRequest.getTime() + RATE_LIMIT_CONFIG.windowMs).toISOString());

    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    // Don't block the request on rate limiter errors
    next();
  }
};

/**
 * Clean up expired entries from the rate limit store
 * Should be called periodically (e.g., every hour)
 */
export const cleanupRateLimitStore = () => {
  const now = new Date();
  let cleanedCount = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    const timeSinceFirstRequest = now.getTime() - entry.firstRequest.getTime();
    if (timeSinceFirstRequest > RATE_LIMIT_CONFIG.windowMs) {
      rateLimitStore.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired rate limit entries`);
  }
};

/**
 * Get rate limit status for a user
 */
export const getRateLimitStatus = (userId: string) => {
  const key = `interview_gen:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      reset: null,
    };
  }

  const now = new Date();
  const timeSinceFirstRequest = now.getTime() - entry.firstRequest.getTime();

  // Check if window has expired
  if (timeSinceFirstRequest > RATE_LIMIT_CONFIG.windowMs) {
    return {
      limit: RATE_LIMIT_CONFIG.maxRequests,
      remaining: RATE_LIMIT_CONFIG.maxRequests,
      reset: null,
    };
  }

  return {
    limit: RATE_LIMIT_CONFIG.maxRequests,
    remaining: Math.max(0, RATE_LIMIT_CONFIG.maxRequests - entry.count),
    reset: new Date(entry.firstRequest.getTime() + RATE_LIMIT_CONFIG.windowMs),
  };
};

// Start cleanup interval (runs every hour)
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
