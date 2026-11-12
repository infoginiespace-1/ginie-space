/**
 * Normalize phone numbers into a consistent 12-digit (for India) or digit-only canonical format
 * so Google Sheets rows, Baileys JIDs, and inbox threads always match cleanly.
 */
export function normalizePhoneDigits(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export function toE164(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  return digits ? `+${digits}` : "";
}
