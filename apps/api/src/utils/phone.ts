/**
 * Utility functions for consistent, human-readable, and canonical phone number handling
 * across Google Sheets, Baileys JIDs, and frontend interfaces.
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

/**
 * Format real phone number for human-friendly UI display:
 * e.g. "919279259690" -> "+91 92792 59690"
 */
export function formatDisplayPhone(raw: string): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return raw || "";

  // Indian mobile format: +91 XXXXX XXXXX
  if (digits.startsWith("91") && digits.length === 12) {
    const country = digits.slice(0, 2);
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7);
    return `+${country} ${p1} ${p2}`;
  }

  // Generic 10 digit fallback
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return `+${digits}`;
}
