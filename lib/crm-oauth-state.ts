import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { CrmProvider } from "@/types";

type CrmOAuthStatePayload = {
  version: 1;
  nonce: string;
  provider: CrmProvider;
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

function getCrmOauthStateSecret() {
  const secret =
    env.crmTokenEncryptionKey ||
    env.ghlClientSecret ||
    env.metaTokenEncryptionKey ||
    env.supabaseServiceKey;
  if (!secret) {
    throw new Error("CRM OAuth state secret is not configured.");
  }
  return secret;
}

function signEncodedPayload(encodedPayload: string) {
  return createHmac("sha256", getCrmOauthStateSecret()).update(encodedPayload).digest("base64url");
}

function normalizeProvider(provider: string | null | undefined): CrmProvider | null {
  switch (provider) {
    case "gohighlevel":
    case "hubspot":
    case "pipedrive":
    case "salesforce":
    case "zoho":
    case "freshsales":
    case "monday":
    case "keap":
    case "close":
      return provider;
    default:
      return null;
  }
}

export function createCrmOAuthState(input: {
  nonce: string;
  provider: CrmProvider;
  workspaceId: string;
  next: string;
}) {
  const payload: CrmOAuthStatePayload = {
    version: 1,
    nonce: input.nonce,
    provider: input.provider,
    workspaceId: input.workspaceId,
    next: input.next,
    issuedAt: Date.now(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signEncodedPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseCrmOAuthState(value: string | null | undefined): CrmOAuthStatePayload | null {
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
  const candidate = parsed as Partial<CrmOAuthStatePayload>;
  const provider = normalizeProvider(typeof candidate.provider === "string" ? candidate.provider : null);

  if (
    candidate.version !== 1 ||
    !provider ||
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
    provider,
    workspaceId: candidate.workspaceId,
    next: candidate.next.startsWith("/") ? candidate.next : "/integrations",
    issuedAt: candidate.issuedAt,
  };
}
