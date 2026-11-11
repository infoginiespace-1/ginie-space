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
  senderName?: string;
  messageText: string;
  timestamp: string;
  messageId: string;
  fromMe: boolean;
}

export interface OutboundMessageRequest {
  userId: string;
  recipientPhone: string;
  messageText: string;
}