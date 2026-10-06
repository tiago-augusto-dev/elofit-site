import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export type Session = {
  access: string;
  refresh: string;
  expires: number;
  refreshExpires: number;
};
function key(secret: string) {
  const value = Buffer.from(secret, "base64");
  if (value.length !== 32)
    throw new Error("SESSION_SECRET must be 32 bytes encoded as base64.");
  return value;
}
export function seal(session: Session, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}
export function unseal(value: string, secret: string): Session | null {
  try {
    const bytes = Buffer.from(value, "base64url");
    const cipher = createDecipheriv(
      "aes-256-gcm",
      key(secret),
      bytes.subarray(0, 12),
    );
    cipher.setAuthTag(bytes.subarray(12, 28));
    const result = JSON.parse(
      Buffer.concat([
        cipher.update(bytes.subarray(28)),
        cipher.final(),
      ]).toString("utf8"),
    );
    if (
      typeof result.access !== "string" ||
      typeof result.refresh !== "string" ||
      typeof result.expires !== "number" ||
      typeof result.refreshExpires !== "number" ||
      result.refreshExpires <= Date.now()
    )
      return null;
    return result;
  } catch {
    return null;
  }
}
