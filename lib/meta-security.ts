import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/env";

function resolveEncryptionSecret() {
  const key = env.metaTokenEncryptionKey || env.metaAppSecret;
  if (!key) {
    throw new Error("Missing META_TOKEN_ENCRYPTION_KEY (or META_APP_SECRET fallback) for Meta token encryption.");
  }
  return key;
}

function buildKeyBuffer() {
  return createHash("sha256").update(resolveEncryptionSecret()).digest();
}

export type EncryptedTokenPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptMetaToken(value: string): EncryptedTokenPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", buildKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptMetaToken(payload: {
  token_ciphertext?: string | null;
  token_iv?: string | null;
  token_tag?: string | null;
}) {
  if (!payload.token_ciphertext || !payload.token_iv || !payload.token_tag) return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      buildKeyBuffer(),
      Buffer.from(payload.token_iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.token_tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.token_ciphertext, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // Key mismatch or corrupted token — treat as unavailable.
    return null;
  }
}
