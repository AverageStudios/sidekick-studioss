import { createHash } from "crypto";
import { NextResponse } from "next/server";

type RateLimitIdentifierSet = {
  ip?: string | null;
  userId?: string | null;
  email?: string | null;
};

type RateLimitCheckOptions = {
  key: string;
  limit: number;
  windowMs: number;
  identifiers: RateLimitIdentifierSet;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  matchedOn: "ip" | "user" | "email" | null;
};

type MemoryBucket = {
  hits: number[];
};

declare global {
  var __sidekickRateLimitStore: Map<string, MemoryBucket> | undefined;
}

const memoryStore = globalThis.__sidekickRateLimitStore || new Map<string, MemoryBucket>();
if (!globalThis.__sidekickRateLimitStore) {
  globalThis.__sidekickRateLimitStore = memoryStore;
}

function pruneBucket(bucket: MemoryBucket, now: number, windowMs: number) {
  bucket.hits = bucket.hits.filter((hit) => hit > now - windowMs);
}

function consumeBucket(storageKey: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memoryStore.get(storageKey) || { hits: [] };
  pruneBucket(bucket, now, windowMs);

  if (bucket.hits.length >= limit) {
    const oldestHit = bucket.hits[0] || now;
    const retryAfterMs = Math.max(1000, oldestHit + windowMs - now);
    memoryStore.set(storageKey, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  bucket.hits.push(now);
  memoryStore.set(storageKey, bucket);
  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

function normalizeEmail(email: string | null | undefined) {
  const value = (email || "").trim().toLowerCase();
  return value || null;
}

function normalizeIp(ip: string | null | undefined) {
  const value = (ip || "").split(",")[0]?.trim() || "";
  return value || null;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function buildIdentifierKeys(key: string, identifiers: RateLimitIdentifierSet) {
  const ip = normalizeIp(identifiers.ip);
  const userId = (identifiers.userId || "").trim() || null;
  const email = normalizeEmail(identifiers.email);

  return [
    ip ? { type: "ip" as const, storageKey: `${key}:ip:${hashValue(ip)}` } : null,
    userId ? { type: "user" as const, storageKey: `${key}:user:${userId}` } : null,
    email ? { type: "email" as const, storageKey: `${key}:email:${hashValue(email)}` } : null,
  ].filter((value): value is { type: "ip" | "user" | "email"; storageKey: string } => Boolean(value));
}

export function getIpFromHeaders(headers: Headers) {
  return (
    headers.get("x-forwarded-for") ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-vercel-forwarded-for") ||
    null
  );
}

export function getIpFromRequest(request: Request) {
  return getIpFromHeaders(request.headers);
}

export function getIpFingerprint(ip: string | null | undefined) {
  const normalized = normalizeIp(ip);
  return normalized ? hashValue(normalized) : "unknown";
}

export function checkRateLimit(options: RateLimitCheckOptions): RateLimitResult {
  const identifierKeys = buildIdentifierKeys(options.key, options.identifiers);

  for (const identifier of identifierKeys) {
    const bucketResult = consumeBucket(identifier.storageKey, options.limit, options.windowMs);
    if (!bucketResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: bucketResult.retryAfterSeconds,
        matchedOn: identifier.type,
      };
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    matchedOn: null,
  };
}

export function logRateLimitHit({
  key,
  retryAfterSeconds,
  matchedOn,
  ip,
  userId,
}: {
  key: string;
  retryAfterSeconds: number;
  matchedOn: "ip" | "user" | "email" | null;
  ip?: string | null;
  userId?: string | null;
}) {
  console.warn("[rate-limit]", {
    key,
    matchedOn: matchedOn || "unknown",
    retryAfterSeconds,
    userId: userId || null,
    ipHash: getIpFingerprint(ip),
    timestamp: new Date().toISOString(),
  });
}

export function createRateLimitResponse(message = "Too many requests. Please wait and try again.", retryAfterSeconds = 60) {
  const response = NextResponse.json(
    { error: message },
    { status: 429 },
  );
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}
