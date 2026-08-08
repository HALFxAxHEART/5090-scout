import { deflate, inflate } from "pako";
import QRCode from "qrcode";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";

/** JSON -> deflate -> base64url, so a scouting record fits comfortably in one QR code. */
export function encodeRecordToPayload(record: SubmitScoutingRecordInput): string {
  const json = JSON.stringify(record);
  const compressed = deflate(json);
  return base64UrlEncode(compressed);
}

export function decodePayloadToRecord(payload: string): SubmitScoutingRecordInput {
  const compressed = base64UrlDecode(payload);
  const json = new TextDecoder().decode(inflate(compressed));
  return JSON.parse(json) as SubmitScoutingRecordInput;
}

export async function renderQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 320 });
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
