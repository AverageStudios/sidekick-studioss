import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

export type MetaOAuthScopeSet = "default" | "lead_forms";

type MetaOAuthStatePayload = {
  version: 1;
  nonce: string;
  workspaceId: string;
  next: string;
  scopeSet: MetaOAuthScopeSet;
  requestedScopes: string[];
  issuedAt: number;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getMetaOauthStateSecret() {
  const secret = env.metaAppSecret || env.supabaseServiceKey;
  if (!secret) {
    throw new Error("Meta OAuth state secret is not configured.");
  }
  return secret;
}

function signEncodedPayload(encodedPayload: string) {
  return createHmac("sha256", getMetaOauthStateSecret()).update(encodedPayload).digest("base64url");
}

function normalizeRequestedScopes(scopes: string[]) {
  return Array.from(
    new Set(scopes.map((scope) => scope.trim()).filter(Boolean)),
  );
}

export function createMetaOAuthState(input: {
  nonce: string;
  workspaceId: string;
  next: string;
  scopeSet: MetaOAuthScopeSet;
  requestedScopes: string[];
}) {
  const payload: MetaOAuthStatePayload = {
    version: 1,
    nonce: input.nonce,
    workspaceId: input.workspaceId,
    next: input.next,
    scopeSet: input.scopeSet,
    requestedScopes: normalizeRequestedScopes(input.requestedScopes),
    issuedAt: Date.now(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseMetaOAuthState(value: string | null | undefined): MetaOAuthStatePayload | null {
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
  const candidate = parsed as Partial<MetaOAuthStatePayload>;
  const scopeSet =
    candidate.scopeSet === "lead_forms" ? "lead_forms" : "default";
  const requestedScopes = Array.isArray(candidate.requestedScopes)
    ? normalizeRequestedScopes(
        candidate.requestedScopes.filter((scope): scope is string => typeof scope === "string"),
      )
    : [];

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
    next: candidate.next.startsWith("/") ? candidate.next : "/workspace/settings?section=integrations",
    scopeSet,
    requestedScopes,
    issuedAt: candidate.issuedAt,
  };
}
