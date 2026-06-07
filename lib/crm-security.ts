import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@/lib/env";

function resolveEncryptionSecret() {
  const key = env.crmTokenEncryptionKey || env.metaTokenEncryptionKey || env.metaAppSecret;
  if (!key) {
    throw new Error("Missing CRM_TOKEN_ENCRYPTION_KEY (or META_TOKEN_ENCRYPTION_KEY fallback) for CRM token encryption.");
  }
  return key;
}

function buildKeyBuffer() {
  return createHash("sha256").update(resolveEncryptionSecret()).digest();
}

export type EncryptedSecretPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptCrmSecret(value: string): EncryptedSecretPayload {
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

export function decryptEncryptedSecret(payload: {
  ciphertext?: string | null;
  iv?: string | null;
  tag?: string | null;
}) {
  if (!payload.ciphertext || !payload.iv || !payload.tag) return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      buildKeyBuffer(),
      Buffer.from(payload.iv, "base64"),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function decryptCrmSecret(payload: {
  token_ciphertext?: string | null;
  token_iv?: string | null;
  token_tag?: string | null;
}) {
  return decryptEncryptedSecret({
    ciphertext: payload.token_ciphertext,
    iv: payload.token_iv,
    tag: payload.token_tag,
  });
}
