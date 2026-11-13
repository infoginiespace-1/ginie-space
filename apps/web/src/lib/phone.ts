export function normalizePhoneDigits(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export function isWhatsAppLid(raw: string): boolean {
  if (!raw) return false;
  const s = String(raw).trim();
  if (s.startsWith("LID:") || s.endsWith("@lid") || s.includes("@lid")) return true;
  const digits = s.replace(/[^0-9]/g, "");
  // WhatsApp LIDs are 14-16 digits starting with 12, 14, 15, 17, 96, etc.
  if (
    digits.length >= 14 &&
    (digits.startsWith("12") ||
      digits.startsWith("14") ||
      digits.startsWith("17") ||
      digits.startsWith("96") ||
      digits.startsWith("13") ||
      digits.startsWith("15"))
  ) {
    return true;
  }
  return false;
}

export function isRealMobile(raw: string): boolean {
  if (!raw || isWhatsAppLid(raw)) return false;
  const digits = (raw || "").replace(/[^0-9]/g, "");
  // Indian 10 digits starting with 6-9 or 12 digits starting with 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) return true;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return true;
  // Standard international phone (10-13 digits)
  if (digits.length >= 10 && digits.length <= 13) return true;
  return false;
}

export function formatDisplayPhone(raw: string): string {
  if (!raw) return "";
  const s = String(raw).trim();
  if (s.startsWith("LID:")) {
    return `WhatsApp ID •••${s.slice(-6)}`;
  }
  if (isWhatsAppLid(s)) {
    const digits = s.replace(/[^0-9]/g, "");
    return `WhatsApp ID •••${digits.slice(-6)}`;
  }

  const digits = normalizePhoneDigits(raw);
  if (!digits) return raw || "";

  if (digits.startsWith("91") && digits.length === 12) {
    const country = digits.slice(0, 2);
    const p1 = digits.slice(2, 7);
    const p2 = digits.slice(7);
    return `+${country} ${p1} ${p2}`;
  }

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return `+${digits}`;
}
