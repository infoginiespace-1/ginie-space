export * from "./types";
export * from "./session-manager";

import { WhatsAppSessionManager } from "./session-manager";
import { AuthStateProvider } from "./types";

export function createWhatsAppManager(
  storagePath?: string,
  authProvider?: AuthStateProvider
): WhatsAppSessionManager {
  return new WhatsAppSessionManager(storagePath, authProvider);
}
