export type SessionStatus = "disconnected" | "connecting" | "connected";

export interface SessionState {
  userId: string;
  status: SessionStatus;
  qrCode?: string; // base64 data url
  phoneNumber?: string;
  name?: string;
  lastActive?: string;
}

export interface InboundMessageEvent {
  userId: string;
  senderJid: string;
  senderPn?: string; // Resolved real phone number JID if present
  isLid?: boolean; // Whether the raw sender is a WhatsApp Linked Identity (LID)
  lid?: string; // Original LID if applicable
  senderName?: string;
  messageText: string;
  timestamp: string;
  messageId: string;
  fromMe: boolean;
}

export interface AntiBanOptions {
  simulateTyping?: boolean;
  typingDurationMs?: number;
  randomizeHash?: boolean;
}

export interface OutboundMessageRequest {
  userId: string;
  recipientPhone: string;
  messageText: string;
  mediaDataUrl?: string;
  antiBan?: AntiBanOptions;
}

export interface AuthStateProvider {
  loadAuthState: (userId: string) => Promise<string | null>;
  saveAuthState: (userId: string, authDataZip: string, phoneNumber?: string) => Promise<void>;
  clearAuthState: (userId: string) => Promise<void>;
}
