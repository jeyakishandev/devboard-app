import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

// paramètres scrypt (safe pour du dev)
const N = 16384;
const r = 8;
const p = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [algo, Nstr, rStr, pStr, saltHex, hashHex] = stored.split("$");
    if (algo !== "scrypt") return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const computed = scryptSync(password, salt, expected.length, {
      N: Number(Nstr),
      r: Number(rStr),
      p: Number(pStr),
    });

    return computed.length === expected.length && timingSafeEqual(computed, expected);
  } catch {
    return false;
  }
}
