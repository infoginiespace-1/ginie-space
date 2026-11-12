export * from "./types";
export * from "./session-manager";

import QRCode from "qrcode";
import { WhatsAppSessionManager } from "./session-manager";
import { AuthStateProvider } from "./types";

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 2, width: 260 });
}

export function createWhatsAppManager(
  storagePath?: string,
  authProvider?: AuthStateProvider
): WhatsAppSessionManager {
  return new WhatsAppSessionManager(storagePath, authProvider);
}
