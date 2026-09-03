import { createHash, timingSafeEqual } from "node:crypto";

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_VALUES = new Map(
  [...BASE58_ALPHABET].map((character, index) => [character, BigInt(index)]),
);

export function isMainnetP2pkhAddress(value) {
  const address = String(value || "").trim();
  if (!/^1[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address)) return false;
  let decoded;
  try {
    decoded = decodeBase58(address);
  } catch {
    return false;
  }
  if (decoded.length !== 25 || decoded[0] !== 0x00) return false;
  const payload = decoded.subarray(0, 21);
  const checksum = decoded.subarray(21);
  const expected = sha256(sha256(payload)).subarray(0, 4);
  return timingSafeEqual(checksum, expected);
}

function decodeBase58(value) {
  let number = 0n;
  for (const character of value) {
    const digit = BASE58_VALUES.get(character);
    if (digit === undefined) throw new Error("invalid base58 character");
    number = number * 58n + digit;
  }

  let hex = number.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const significant = number === 0n ? Buffer.alloc(0) : Buffer.from(hex, "hex");
  const leadingZeroes = value.match(/^1*/)?.[0].length || 0;
  return Buffer.concat([Buffer.alloc(leadingZeroes), significant]);
}

function sha256(value) {
  return createHash("sha256").update(value).digest();
}
