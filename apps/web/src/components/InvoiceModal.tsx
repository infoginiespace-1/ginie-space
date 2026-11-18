"use client";

import React from "react";
import { Modal, Button, Space, Tag, Typography, Table, Divider, Row, Col } from "antd";
import { PrinterOutlined, WhatsAppOutlined, DownloadOutlined, CheckCircleFilled, BankOutlined } from "@ant-design/icons";
import { QRCode } from "antd";

const { Title, Text, Paragraph } = Typography;

export interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  unit?: string;
}

export interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress?: string;
    itemsJson?: string;
    items?: InvoiceItem[];
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    paidAmount?: number;
    discountAmount?: number;
    deliveryCharge?: number;
    couponCode?: string;
    bookingDate?: string;
    timeSlot?: string;
    serviceMode?: string;
    assignedStaff?: string;
    createdAt: string;
  } | null;
  store: {
    name: string;
    phone?: string;
    address?: string;
    gstin?: string;
    gstRate?: number;
    upiId?: string;
    businessType?: string;
  };
}

export function InvoiceModal({ open, onClose, order, store }: InvoiceModalProps) {
  if (!order) return null;

  let items: InvoiceItem[] = [];
  if (Array.isArray(order.items)) {
    items = order.items;
  } else if (order.itemsJson) {
    try {
      items = JSON.parse(order.itemsJson);
    } catch {}
  }

  const invoiceNumber = `INV-${order.id.slice(-6).toUpperCase()}`;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const grandTotal = Number(order.totalAmount) || 0;
  const gstRate = Number(store.gstRate) || 0;
  const isTaxInvoice = Boolean(store.gstin && store.gstin.trim());
  const baseAmount = gstRate > 0 ? grandTotal / (1 + gstRate / 100) : grandTotal;
  const totalTax = gstRate > 0 ? grandTotal - baseAmount : 0;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  const effectiveUpi = store.upiId && store.upiId.trim() ? store.upiId.trim() : "";
  const upiPayUrl = effectiveUpi
    ? `upi://pay?pa=${effectiveUpi}&pn=${encodeURIComponent(store.name)}&am=${grandTotal}&tn=${encodeURIComponent(invoiceNumber)}&cu=INR`
    : "";

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const phone = order.customerPhone.replace(/\D/g, "");
    if (!phone) return;
    const msg =
      `Namaste ${order.customerName}!\n\n` +
      `Here is your invoice for Order *#${invoiceNumber}* from *${store.name}*:\n` +
      `Total Amount: *₹${grandTotal.toLocaleString("en-IN")}*\n` +
      `Payment Status: *${(order.paymentStatus || "unpaid").toUpperCase()}*\n\n` +
      `Items:\n` +
      items.map((i) => `• ${i.name} (x${i.quantity}) - ₹${i.price * i.quantity}`).join("\n") +
      `\n\nThank you for shopping with us! 🙏`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={760}
        destroyOnClose
        className="invoice-modal-dialog"
      >
        {/* Screen Action Bar (Hidden on print) */}
        <div className="no-print" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
              🧾 {isTaxInvoice ? "Tax Invoice" : "Retail Bill & Order Receipt"}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Official invoice with itemized tax breakdown and Direct UPI payment verification.
            </Text>
          </div>
          <Space>
            {order.customerPhone && (
              <Button
                icon={<WhatsAppOutlined />}
                onClick={handleShareWhatsApp}
                style={{ color: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
              >
                Share on WhatsApp
              </Button>
            )}
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700 }}
            >
              Print / Save PDF
            </Button>
          </Space>
        </div>

        {/* Printable Invoice Sheet */}
        <div
          id="printable-invoice-root"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "24px 28px",
            color: "#0f172a",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, borderBottom: "2px solid #059669", paddingBottom: 14 }}>
            <div>
              <Tag color={isTaxInvoice ? "blue" : "green"} style={{ fontWeight: 800, padding: "2px 8px", fontSize: 11, marginBottom: 6 }}>
                {isTaxInvoice ? "GST TAX INVOICE" : "RETAIL INVOICE / BILL"}
              </Tag>
              <Title level={3} style={{ margin: "2px 0 4px", color: "#0f172a", fontWeight: 800 }}>
                {store.name}
              </Title>
              {store.address && (
                <div style={{ fontSize: 12, color: "#475569", maxWidth: 360 }}>
                  {store.address}
                </div>
              )}
              {store.phone && (
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                  Phone: <strong>{store.phone}</strong>
                </div>
              )}
              {store.gstin && (
                <div style={{ fontSize: 12, color: "#0f172a", marginTop: 4, fontWeight: 700 }}>
                  GSTIN: {store.gstin}
                </div>
              )}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>
                #{invoiceNumber}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                Date: <strong>{orderDate}</strong>
              </div>
              <div style={{ marginTop: 6 }}>
                <Tag
                  color={
                    order.status === "delivered" ? "green" :
                    order.status === "cancelled" ? "red" :
                    order.status === "confirmed" ? "blue" : "orange"
                  }
                  style={{ fontWeight: 700, padding: "2px 8px" }}
                >
                  ORDER {order.status.toUpperCase()}
                </Tag>
              </div>
              <div style={{ marginTop: 4 }}>
                <Tag
                  color={order.paymentStatus === "paid" ? "green" : "volcano"}
                  style={{ fontWeight: 700, padding: "2px 8px" }}
                >
                  PAYMENT: {(order.paymentStatus || "unpaid").toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          {/* Customer / Bill To Details */}
          <div style={{ margin: "16px 0", background: "#f8fafc", padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 8]}>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                  Billed To:
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginTop: 2 }}>
                  {order.customerName}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  📞 +{order.customerPhone.replace(/^\+/, "")}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                  Fulfillment &amp; Delivery:
                </div>
                <div style={{ fontSize: 12, color: "#0f172a", marginTop: 2, fontWeight: 500 }}>
                  {order.deliveryAddress || "Self Store Pickup"}
                </div>
                {order.bookingDate && (
                  <div style={{ fontSize: 12, color: "#059669", marginTop: 2, fontWeight: 600 }}>
                    📅 Appointment: {order.bookingDate} {order.timeSlot ? `• ${order.timeSlot}` : ""}
                  </div>
                )}
                {order.assignedStaff && (
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Staff: {order.assignedStaff}
                  </div>
                )}
              </Col>
            </Row>
          </div>

          {/* Itemized Table */}
          <Table
            size="small"
            pagination={false}
            dataSource={items}
            rowKey={(r, idx) => `${r.name}_${idx}`}
            columns={[
              {
                title: "S.No",
                width: 60,
                render: (_: any, __: any, index: number) => index + 1,
              },
              {
                title: "Item Description",
                dataIndex: "name",
                render: (val: string, r: InvoiceItem) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{val}</div>
                    {r.unit && <div style={{ fontSize: 11, color: "#64748b" }}>Unit: {r.unit}</div>}
                  </div>
                ),
              },
              {
                title: "Rate (₹)",
                dataIndex: "price",
                align: "right" as const,
                width: 100,
                render: (p: number) => `₹${Number(p).toFixed(2)}`,
              },
              {
                title: "Qty",
                dataIndex: "quantity",
                align: "center" as const,
                width: 70,
              },
              {
                title: "Total (₹)",
                align: "right" as const,
                width: 120,
                render: (_: any, r: InvoiceItem) => (
                  <Text strong>₹{(Number(r.price) * Number(r.quantity)).toFixed(2)}</Text>
                ),
              },
            ]}
            style={{ marginBottom: 16 }}
          />

          {/* Totals & Tax Breakdown Row */}
          <Row gutter={[16, 16]} justify="space-between" align="bottom">
            <Col xs={24} sm={12}>
              {effectiveUpi && (
                <div style={{ background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 8, padding: 12, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ background: "#fff", padding: 6, borderRadius: 6, border: "1px solid #d1fae5" }}>
                    <QRCode value={upiPayUrl || `upi://pay?pa=${effectiveUpi}`} size={84} bordered={false} errorLevel="M" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase" }}>
                      Direct UPI QR
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>
                      {effectiveUpi}
                    </div>
                    <div style={{ fontSize: 10, color: "#047857", marginTop: 2 }}>
                      Scan with PhonePe, GPay, Paytm
                    </div>
                  </div>
                </div>
              )}
            </Col>

            <Col xs={24} sm={12}>
              <div style={{ textAlign: "right", fontSize: 13, lineHeight: 1.8 }}>
                {Number(order.discountAmount) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                    <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}:</span>
                    <span>-₹{Number(order.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.deliveryCharge) > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                    <span>Delivery Charge:</span>
                    <span>+₹{Number(order.deliveryCharge).toFixed(2)}</span>
                  </div>
                )}
                {gstRate > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                      <span>Subtotal (Excl. Tax):</span>
                      <span>₹{baseAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                      <span>CGST ({gstRate / 2}%):</span>
                      <span>₹{cgst.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
                      <span>SGST ({gstRate / 2}%):</span>
                      <span>₹{sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                <Divider style={{ margin: "6px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#059669" }}>
                  <span>Grand Total:</span>
                  <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {order.paymentStatus === "paid" ? (
                  <div style={{ color: "#16a34a", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                    ✓ 100% Paid directly to merchant bank
                  </div>
                ) : (
                  <div style={{ color: "#dc2626", fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                    Balance Due: ₹{Math.max(0, grandTotal - (Number(order.paidAmount) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </Col>
          </Row>

          {/* Invoice Terms & Signatory Footer */}
          <div style={{ borderTop: "1px dashed #cbd5e1", marginTop: 18, paddingTop: 10, fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              1. This is a computer-generated tax invoice created via GinieSpace.<br />
              2. 100% direct bank settlement with zero gateway fees.
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: "#0f172a" }}>For {store.name}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Authorized Signatory</div>
            </div>
          </div>
        </div>

        {/* Screen Bottom Actions (Hidden on print) */}
        <div className="no-print" style={{ textAlign: "center", marginTop: 20 }}>
          <Space size="middle">
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Close
            </Button>
            {order.customerPhone && (
              <Button
                icon={<WhatsAppOutlined />}
                onClick={handleShareWhatsApp}
                style={{ color: "#25D366", borderColor: "#25D366", fontWeight: 600, borderRadius: 8 }}
              >
                Send to Customer on WhatsApp
              </Button>
            )}
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700, borderRadius: 8 }}
            >
              Print / Save PDF
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-modal-dialog,
          .invoice-modal-dialog .ant-modal-content,
          #printable-invoice-root,
          #printable-invoice-root * {
            visibility: visible !important;
          }
          .invoice-modal-dialog {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .invoice-modal-dialog .ant-modal-content {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .invoice-modal-dialog .ant-modal-close,
          .no-print {
            display: none !important;
          }
          #printable-invoice-root {
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            padding: 24px 16px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  );
}
