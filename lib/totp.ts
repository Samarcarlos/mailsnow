import { createHmac, randomBytes } from "crypto";

function base32Decode(input: string): Buffer {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const str = input.toUpperCase().replace(/=+$/, "");
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of str) {
    const idx = chars.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

function base32Encode(buf: Buffer): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += chars[(value >> bits) & 31];
    }
  }
  if (bits > 0) output += chars[(value << (5 - bits)) & 31];
  return output;
}

export function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20));
}

export function generateTOTPToken(secret: string): string {
  const key = base32Decode(secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, "0");
}

export function verifyTOTPToken(secret: string, token: string, window = 1): boolean {
  const key = base32Decode(secret);
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const counter = step + i;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    if (code.toString().padStart(6, "0") === token) return true;
  }
  return false;
}

export function generateTOTPUri(account: string, secret: string, issuer: string): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
