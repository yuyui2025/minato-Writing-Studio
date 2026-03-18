import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "BYOK_ENCRYPTION_KEY";

function getEncryptionKey(): Buffer {
  const keyHex = process.env[KEY_ENV];
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("BYOK_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

export function encryptByokKey(plaintext: string): { encryptedKey: string; iv: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // tag を encrypted に付加して保存
  const payload = Buffer.concat([encrypted, tag]);
  return {
    encryptedKey: payload.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function getDecryptedByokKey(encryptedKey: string, ivBase64: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, "base64");
  const payload = Buffer.from(encryptedKey, "base64");
  // 末尾16バイトがauthTag
  const tag = payload.slice(payload.length - 16);
  const encrypted = payload.slice(0, payload.length - 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}
