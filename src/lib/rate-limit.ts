import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type AuthRateLimitName =
  | "login"
  | "register"
  | "passwordForgot"
  | "passwordReset"
  | "verificationResend";

type AiRateLimitName = "autoTag" | "summary";

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

interface AiRateLimitOptions {
  identifier: string;
  type: AiRateLimitName;
}

export interface AuthRateLimitResult {
  remaining: number;
  reason: "limited" | "unavailable" | null;
  reset: number;
  success: boolean;
}

const RATE_LIMIT_ERROR_CODE_PREFIX = "rate_limited_";
const RATE_LIMIT_UNAVAILABLE_ERROR_CODE = "rate_limit_unavailable";
const RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "Auth protection is temporarily unavailable. Please try again shortly.";

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

const AI_RATE_LIMIT_CONFIG: Record<AiRateLimitName, AuthRateLimitConfig> = {
  autoTag: {
    limit: 20,
    prefix: "devstash:rate-limit:ai:auto-tag",
    window: "1 h",
  },
  summary: {
    limit: 20,
    prefix: "devstash:rate-limit:ai:summary",
    window: "1 h",
  },
};

let redis: Redis | null | undefined;
const limiters = new Map<AuthRateLimitName, Ratelimit>();
const aiLimiters = new Map<AiRateLimitName, Ratelimit>();
let hasWarnedRateLimitBypass = false;

const getBypassRateLimitResult = (type: AuthRateLimitName): AuthRateLimitResult => ({
  remaining: AUTH_RATE_LIMIT_CONFIG[type].limit,
  reason: null,
  reset: Date.now(),
  success: true,
});

const getUnavailableRateLimitResult = (): AuthRateLimitResult => ({
  remaining: 0,
  reason: "unavailable",
  reset: Date.now(),
  success: false,
});

const getAiBypassRateLimitResult = (type: AiRateLimitName): AuthRateLimitResult => ({
  remaining: AI_RATE_LIMIT_CONFIG[type].limit,
  reason: null,
  reset: Date.now(),
  success: true,
});

const shouldFailClosed = () => process.env.NODE_ENV === "production";

const warnRateLimitBypass = (reason: string) => {
  if (hasWarnedRateLimitBypass) {
    return;
  }

  hasWarnedRateLimitBypass = true;
  console.warn(`Auth rate limiting is bypassed in non-production: ${reason}`);
};

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

const getAiRateLimiter = (type: AiRateLimitName) => {
  const existingLimiter = aiLimiters.get(type);

  if (existingLimiter) {
    return existingLimiter;
  }

  const redisClient = getRedis();

  if (!redisClient) {
    return null;
  }

  const config = AI_RATE_LIMIT_CONFIG[type];
  const ratelimit = new Ratelimit({
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: config.prefix,
    redis: redisClient,
  });

  aiLimiters.set(type, ratelimit);
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
    if (shouldFailClosed()) {
      return getUnavailableRateLimitResult();
    }

    warnRateLimitBypass("Upstash Redis is not configured.");
    return getBypassRateLimitResult(type);
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
      reason: result.success ? null : "limited",
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${type}`, error);

    if (shouldFailClosed()) {
      return getUnavailableRateLimitResult();
    }

    warnRateLimitBypass("rate-limit checks are failing.");
    return getBypassRateLimitResult(type);
  }
};

export const checkAiRateLimit = async ({
  identifier,
  type,
}: AiRateLimitOptions): Promise<AuthRateLimitResult> => {
  const ratelimit = getAiRateLimiter(type);

  if (!ratelimit) {
    if (shouldFailClosed()) {
      return getUnavailableRateLimitResult();
    }

    warnRateLimitBypass("Upstash Redis is not configured.");
    return getAiBypassRateLimitResult(type);
  }

  try {
    const result = await ratelimit.limit(identifier);

    return {
      remaining: result.remaining,
      reason: result.success ? null : "limited",
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`Rate limit check failed for ${type}`, error);

    if (shouldFailClosed()) {
      return getUnavailableRateLimitResult();
    }

    warnRateLimitBypass("rate-limit checks are failing.");
    return getAiBypassRateLimitResult(type);
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

export const getRateLimitUnavailableErrorCode = () => RATE_LIMIT_UNAVAILABLE_ERROR_CODE;

export const isRateLimitUnavailable = (result: AuthRateLimitResult) =>
  result.reason === "unavailable";

export const getRateLimitMessageFromCode = (code?: string | null) => {
  if (code === RATE_LIMIT_UNAVAILABLE_ERROR_CODE) {
    return RATE_LIMIT_UNAVAILABLE_MESSAGE;
  }

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

export const createRateLimitUnavailableResponse = () =>
  NextResponse.json(
    { error: RATE_LIMIT_UNAVAILABLE_MESSAGE },
    {
      status: 503,
    },
  );
