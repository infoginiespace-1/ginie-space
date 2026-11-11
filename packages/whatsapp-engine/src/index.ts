export * from "./types";
export * from "./session-manager";

import { WhatsAppSessionManager } from "./session-manager";

export function createWhatsAppManager(storagePath?: string): WhatsAppSessionManager {
  return new WhatsAppSessionManager(storagePath);
}