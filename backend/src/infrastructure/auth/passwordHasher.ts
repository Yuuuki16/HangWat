import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;
const saltLength = 16;
const algorithm = "scrypt";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(saltLength).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  return `${algorithm}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== algorithm) {
    return false;
  }

  const [, salt, keyHex] = parts;
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const storedKey = Buffer.from(keyHex, "hex");
  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedKey, derivedKey);
}
