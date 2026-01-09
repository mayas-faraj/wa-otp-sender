/**
 * Convert phone number to WhatsApp chat id: "<digits>@c.us"
 * Accepts E.164 input like "+31612345678" (recommended).
 */
export function toWaId(phoneE164: string): string {
  const digits = phoneE164.replace(/[^\d]/g, "");
  if (digits.length < 8) {
    throw new Error(`Invalid phone number: "${phoneE164}" (too short)`);
  }
  return `${digits}@c.us`;
}
