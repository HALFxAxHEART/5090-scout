/**
 * cyrb128 — small, well-mixing, deterministic string hash (public-domain algorithm).
 * We use it (not crypto.randomUUID()) for scouting-record ids so re-opening the same
 * match+team+scout on a reloaded page derives the exact same id and recovers the local
 * draft, instead of minting a new orphaned record.
 */
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Deterministic, UUID-v4-shaped id from arbitrary parts (not cryptographically random). */
export function stableRecordId(...parts: string[]): string {
  const hex = cyrb128(parts.join("|"))
    .map((n) => n.toString(16).padStart(8, "0"))
    .join("");
  const chars = hex.split("");
  chars[12] = "4"; // version 4
  chars[16] = ((parseInt(chars[16] ?? "0", 16) & 0x3) | 0x8).toString(16); // variant
  const h = chars.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
