import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

type GhlOAuthStatePayload = {
  version: 1;
  nonce: string;
  workspaceId: string;
  next: string;
  issuedAt: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getGhlOauthStateSecret() {
  const secret =
    env.ghlClientSecret ||
    env.crmTokenEncryptionKey ||
    env.metaTokenEncryptionKey ||
    env.supabaseServiceKey;
  if (!secret) {
    throw new Error("GoHighLevel OAuth state secret is not configured.");
  }
  return secret;
}

function signEncodedPayload(encodedPayload: string) {
  return createHmac("sha256", getGhlOauthStateSecret()).update(encodedPayload).digest("base64url");
}

export function createGhlOAuthState(input: {
  nonce: string;
  workspaceId: string;
  next: string;
}) {
  const payload: GhlOAuthStatePayload = {
    version: 1,
    nonce: input.nonce,
    workspaceId: input.workspaceId,
    next: input.next,
    issuedAt: Date.now(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseGhlOAuthState(value: string | null | undefined): GhlOAuthStatePayload | null {
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signEncodedPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const candidate = parsed as Partial<GhlOAuthStatePayload>;

  if (
    candidate.version !== 1 ||
    typeof candidate.nonce !== "string" ||
    typeof candidate.workspaceId !== "string" ||
    typeof candidate.next !== "string" ||
    typeof candidate.issuedAt !== "number"
  ) {
    return null;
  }

  return {
    version: 1,
    nonce: candidate.nonce,
    workspaceId: candidate.workspaceId,
    next: candidate.next.startsWith("/") ? candidate.next : "/integrations",
    issuedAt: candidate.issuedAt,
  };
}
