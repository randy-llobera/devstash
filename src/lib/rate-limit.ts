import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type AuthRateLimitName =
  | "login"
  | "register"
  | "passwordForgot"
  | "passwordReset"
  | "verificationResend";

interface AuthRateLimitConfig {
  limit: number;
  prefix: string;
  window: `${number} ${"s" | "m" | "h"}`;
}

interface AuthRateLimitOptions {
  identifier?: string | null;
  keyBy: "ip" | "ip-email";
  request: Request;
  type: AuthRateLimitName;
}

export interface AuthRateLimitResult {
  remaining: number;
  reset: number;
  success: boolean;
}

const RATE_LIMIT_ERROR_CODE_PREFIX = "rate_limited_";

const AUTH_RATE_LIMIT_CONFIG: Record<AuthRateLimitName, AuthRateLimitConfig> = {
  login: {
    limit: 5,
    prefix: "devstash:rate-limit:auth:login",
    window: "15 m",
  },
  passwordForgot: {
    limit: 3,
    prefix: "devstash:rate-limit:auth:password-forgot",
    window: "1 h",
  },
  passwordReset: {
    limit: 5,
    prefix: "devstash:rate-limit:auth:password-reset",
    window: "15 m",
  },
  register: {
    limit: 3,
    prefix: "devstash:rate-limit:auth:register",
    window: "1 h",
  },
  verificationResend: {
    limit: 3,
    prefix: "devstash:rate-limit:auth:verification-resend",
    window: "15 m",
  },
};

let redis: Redis | null | undefined;
const limiters = new Map<AuthRateLimitName, Ratelimit>();

const getFallbackRateLimitResult = (type: AuthRateLimitName): AuthRateLimitResult => ({
  remaining: AUTH_RATE_LIMIT_CONFIG[type].limit,
  reset: Date.now(),
  success: true,
});

const getRedis = () => {
  if (redis !== undefined) {
    return redis;
  }

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = null;
    return redis;
  }

  redis = new Redis({
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    url: process.env.UPSTASH_REDIS_REST_URL,
  });

  return redis;
};

const getRateLimiter = (type: AuthRateLimitName) => {
  const existingLimiter = limiters.get(type);

  if (existingLimiter) {
    return existingLimiter;
  }

  const redisClient = getRedis();

  if (!redisClient) {
    return null;
  }

  const config = AUTH_RATE_LIMIT_CONFIG[type];
  const ratelimit = new Ratelimit({
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
    redis: redisClient,
  });

  limiters.set(type, ratelimit);
  return ratelimit;
};

const getForwardedIp = (headerValue: string | null) => {
  if (!headerValue) {
    return null;
  }

  const [firstIp] = headerValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return firstIp || null;
};

export const getRequestIp = (request: Request) =>
  getForwardedIp(request.headers.get("x-forwarded-for")) ||
  request.headers.get("x-real-ip") ||
  request.headers.get("cf-connecting-ip") ||
  request.headers.get("true-client-ip") ||
  null;

const normalizeIdentifier = (identifier?: string | null) =>
  typeof identifier === "string" ? identifier.trim().toLowerCase() : "";

const getRateLimitKey = ({
  identifier,
  keyBy,
  request,
}: Pick<AuthRateLimitOptions, "identifier" | "keyBy" | "request">) => {
  const ip = getRequestIp(request) ?? "unknown";

  if (keyBy === "ip") {
    return ip;
  }

  const normalizedIdentifier = normalizeIdentifier(identifier) || "unknown";
  return `${ip}:${normalizedIdentifier}`;
};

export const checkAuthRateLimit = async ({
  identifier,
  keyBy,
  request,
  type,
}: AuthRateLimitOptions): Promise<AuthRateLimitResult> => {
  const ratelimit = getRateLimiter(type);

  if (!ratelimit) {
    return getFallbackRateLimitResult(type);
  }

  try {
    const result = await ratelimit.limit(
      getRateLimitKey({ identifier, keyBy, request }),
      {
        ip: getRequestIp(request) ?? undefined,
      },
    );

    return {
      remaining: result.remaining,
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${type}`, error);
    return getFallbackRateLimitResult(type);
  }
};

export const getRateLimitMessage = (reset: number) => {
  const minutesUntilReset = getRateLimitMinutesUntilReset(reset);
  return `Too many attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset === 1 ? "" : "s"}.`;
};

export const getRateLimitMinutesUntilReset = (reset: number) =>
  Math.max(1, Math.ceil((reset - Date.now()) / 60_000));

export const getRateLimitErrorCode = (reset: number) =>
  `${RATE_LIMIT_ERROR_CODE_PREFIX}${getRateLimitMinutesUntilReset(reset)}`;

export const getRateLimitMessageFromCode = (code?: string | null) => {
  if (!code?.startsWith(RATE_LIMIT_ERROR_CODE_PREFIX)) {
    return null;
  }

  const minutesValue = Number(code.slice(RATE_LIMIT_ERROR_CODE_PREFIX.length));

  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    return null;
  }

  const minutes = Math.ceil(minutesValue);
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
};

export const createRateLimitErrorResponse = (result: AuthRateLimitResult) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return NextResponse.json(
    { error: getRateLimitMessage(result.reset) },
    {
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
      status: 429,
    },
  );
};
