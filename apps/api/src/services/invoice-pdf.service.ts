import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { Order, BusinessProfile, OrderItem } from "@giniespace/sheets-db";

export async function generateInvoicePdfBuffer(
  order: Order,
  biz: BusinessProfile | null,
  items: OrderItem[]
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      // Parse business settings for upiId and GSTIN
      let bizSettings: any = {};
      try {
        if (biz?.settingsJson) bizSettings = JSON.parse(biz.settingsJson);
      } catch {}

      const storeName = biz?.name || "GinieSpace Store";
      const storePhone = biz?.phone || "";
      const storeAddress = biz?.address || "";
      const storeGstin = bizSettings.gstin || "";
      const upiId = bizSettings.upiId || "";

      // 1. Top Header Banner
      doc.rect(0, 0, 595.28, 85).fill("#064e3b"); // Deep emerald green
      doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text(storeName, 40, 22);
      
      const subHeaderParts = [
        storeAddress,
        storePhone ? `Phone: +${storePhone}` : "",
        storeGstin ? `GSTIN: ${storeGstin}` : "",
      ].filter(Boolean);
      doc.fontSize(9).font("Helvetica").text(subHeaderParts.join(" | "), 40, 48, { width: 340 });

      // "TAX INVOICE" Badge on Top Right
      doc.fillColor("#34d399").fontSize(13).font("Helvetica-Bold").text("TAX INVOICE / RECEIPT", 380, 22, { align: "right" });
      doc.fillColor("#e2e8f0").fontSize(9).font("Helvetica").text(`Inv #: INV-${order.id.slice(-6).toUpperCase()}`, 380, 42, { align: "right" });
      
      const invDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.text(`Date: ${invDate}`, 380, 56, { align: "right" });

      // 2. Bill To & Order Summary Section
      doc.roundedRect(40, 105, 515.28, 65, 6).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold").text("BILL TO (CUSTOMER):", 55, 115);
      doc.font("Helvetica").fontSize(10).text(order.customerName || "Valued Customer", 55, 131);
      doc.fontSize(9).fillColor("#475569").text(
        `Phone: ${order.customerPhone || "N/A"}${order.deliveryAddress ? ` | Address: ${order.deliveryAddress}` : ""}`,
        55,
        147,
        { width: 360 }
      );

      // Payment Status Pill
      const isPaid = order.paymentStatus === "paid";
      const statusColor = isPaid ? "#16a34a" : "#dc2626";
      const statusBg = isPaid ? "#dcfce7" : "#fee2e2";
      doc.roundedRect(430, 118, 110, 24, 4).fill(statusBg);
      doc.fillColor(statusColor).fontSize(10).font("Helvetica-Bold").text(
        isPaid ? "PAID" : "UNPAID",
        430,
        124,
        { width: 110, align: "center" }
      );

      // 3. Table Header
      let y = 190;
      doc.rect(40, y, 515.28, 24).fill("#0f172a");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      doc.text("#", 50, y + 7, { width: 25 });
      doc.text("ITEM DESCRIPTION", 80, y + 7, { width: 250 });
      doc.text("QTY", 335, y + 7, { width: 40, align: "center" });
      doc.text("UNIT PRICE", 380, y + 7, { width: 80, align: "right" });
      doc.text("AMOUNT", 465, y + 7, { width: 80, align: "right" });

      // Table Rows
      y += 24;
      doc.font("Helvetica").fontSize(9).fillColor("#1e293b");

      let subtotal = 0;
      const parsedItems = Array.isArray(items) && items.length > 0 ? items : [{ productId: "1", name: "General Order Items", quantity: 1, price: order.totalAmount }];

      parsedItems.forEach((item, idx) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        const itemTotal = qty * price;
        subtotal += itemTotal;

        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(40, y, 515.28, 22).fill(rowBg);

        doc.fillColor("#334155");
        doc.text(String(idx + 1), 50, y + 6, { width: 25 });
        doc.text(item.name || "Item", 80, y + 6, { width: 250, ellipsis: true });
        doc.text(String(qty), 335, y + 6, { width: 40, align: "center" });
        doc.text(`INR ${price.toLocaleString("en-IN")}`, 380, y + 6, { width: 80, align: "right" });
        doc.text(`INR ${itemTotal.toLocaleString("en-IN")}`, 465, y + 6, { width: 80, align: "right" });

        y += 22;
      });

      // Bottom border for items
      doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(40, y).lineTo(555.28, y).stroke();
      y += 15;

      // 4. Totals & UPI Payment Section
      const grandTotal = Number(order.totalAmount) || subtotal;
      const discount = Number(order.discountAmount) || 0;
      const delivery = Number(order.deliveryCharge) || 0;
      const paid = isPaid ? grandTotal : Number(order.paidAmount) || 0;
      const balanceDue = Math.max(0, grandTotal - paid);

      // Financial Summary on Right
      const rightX = 350;
      doc.fillColor("#475569").fontSize(9);
      doc.text("Items Subtotal:", rightX, y);
      doc.text(`INR ${subtotal.toLocaleString("en-IN")}`, 465, y, { width: 80, align: "right" });
      y += 16;

      if (discount > 0) {
        doc.fillColor("#16a34a").text("Discount:", rightX, y);
        doc.text(`-INR ${discount.toLocaleString("en-IN")}`, 465, y, { width: 80, align: "right" });
        y += 16;
      }

      if (delivery > 0) {
        doc.fillColor("#475569").text("Delivery Charge:", rightX, y);
        doc.text(`+INR ${delivery.toLocaleString("en-IN")}`, 465, y, { width: 80, align: "right" });
        y += 16;
      }

      doc.rect(rightX - 10, y - 2, 215.28, 24).fill("#064e3b");
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11).text("Grand Total:", rightX, y + 5);
      doc.text(`INR ${grandTotal.toLocaleString("en-IN")}`, 465, y + 5, { width: 80, align: "right" });
      y += 30;

      if (balanceDue > 0) {
        doc.fillColor("#dc2626").font("Helvetica-Bold").fontSize(10).text("Balance Due:", rightX, y);
        doc.text(`INR ${balanceDue.toLocaleString("en-IN")}`, 465, y, { width: 80, align: "right" });
      }

      // Left Box: UPI QR Code for Instant Payment (if unpaid and UPI ID exists)
      if (upiId && balanceDue > 0) {
        const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${balanceDue}&cu=INR&tn=Invoice-${order.id.slice(-6)}`;
        try {
          const qrPng = await QRCode.toBuffer(upiLink, { width: 90, margin: 1 });
          doc.image(qrPng, 50, y - 55, { width: 85, height: 85 });
          doc.fillColor("#065f46").font("Helvetica-Bold").fontSize(8).text("SCAN & PAY VIA ANY UPI APP", 50, y + 35);
          doc.fillColor("#64748b").font("Helvetica").fontSize(7).text(`UPI: ${upiId}`, 50, y + 46);
        } catch {}
      }

      // Footer Note
      doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text(
        "This is a computer-generated tax invoice issued via GinieSpace Platform (https://ginie.space). No physical signature required.",
        40,
        780,
        { align: "center", width: 515.28 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
