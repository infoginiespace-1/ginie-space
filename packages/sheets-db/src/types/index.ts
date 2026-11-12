export type UserRole = "admin" | "user";
export type BusinessType = "retail" | "wholesale";
export type OrderStatus = "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type LeadStatus = "new" | "contacted" | "converted" | "archived";
export type WhatsAppStatus = "disconnected" | "connecting" | "connected";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  businessType: BusinessType;
  status?: "active" | "suspended";
  plan?: "free" | "pro";
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  category?: string;
  minOrderQty?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  itemsJson: string;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  discountAmount?: number;
  deliveryCharge?: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  placeId: string;
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  category: string;
  status: LeadStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: string;
  userId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppSession {
  id: string;
  userId: string;
  status: WhatsAppStatus;
  qrCode?: string;
  phoneNumber?: string;
  credentialsZip?: string;
  lastSeen?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  contactPhone: string;
  contactName?: string;
  text: string;
  fromMe: string;
  messageId?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}
