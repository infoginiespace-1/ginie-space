"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Input,
  Badge,
  Drawer,
  Form,
  Space,
  Empty,
  Spin,
  Result,
  message,
  Divider,
  Select,
  Modal,
  Alert,
  Segmented,
  Tooltip,
  QRCode,
  Checkbox,
} from "antd";
import {
  ShopOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  WhatsAppOutlined,
  SearchOutlined,
  ShareAltOutlined,
  StarFilled,
  SafetyCertificateFilled,
  ThunderboltFilled,
  ClockCircleOutlined,
  EyeOutlined,
  CoffeeOutlined,
  SkinOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ToolOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  MobileOutlined,
  CheckCircleFilled,
  LockOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { api } from "../../../lib/api";
import { InvoiceModal } from "../../../components/InvoiceModal";

const { Title, Text } = Typography;

interface StoreInfo {
  id: string;
  slug?: string;
  name: string;
  phone?: string;
  address?: string;
  businessType?: string;
  upiId?: string;
  gstin?: string;
  gstRate?: number;
  deliveryFee?: number;
  coupons?: Array<{ code: string; discountPercent: number }>;
  logoUrl?: string;
  isOpen?: boolean;
  closedMessage?: string;
}

interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  category?: string;
  minOrderQty?: number;
  itemType?: "product" | "service";
  duration?: string;
  serviceMode?: "at_store" | "home_visit" | "online" | "any";
  dietary?: "veg" | "non_veg" | "egg";
  sizes?: string;
  colors?: string;
  roomType?: string;
}

const STORE_TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

const STORE_SERVICE_MODE_TEXT: Record<string, string> = {
  home_visit: "Home Visit",
  at_store: "At Store / Clinic",
  online: "Online / Remote",
  any: "Store or Home Visit",
};

// Feature 3: Storefront Multi-Language Dictionary (English / Hindi)
const I18N = {
  en: {
    specialOffer: "Free Local Delivery on orders above ₹499!",
    verified: "Verified Merchant",
    instantWa: "Instant WhatsApp Order",
    open: "● Open (9 AM – 9 PM)",
    closed: "CLOSED",
    trackOrder: "Track Order",
    cart: "Cart",
    searchPlaceholder: "Search products or services...",
    allCategories: "All",
    addToCart: "Add",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    deliveryPref: "Delivery Preference:",
    homeDelivery: "🛵 Home Delivery",
    storePickup: "🏪 Store Self-Pickup",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Charge",
    grandTotal: "Grand Total",
    fullName: "Your Full Name",
    mobile: "WhatsApp Mobile Number",
    address: "Delivery Address & Pincode",
    paymentMethod: "Payment Method:",
    payUpi: "💳 Pay via UPI",
    payCod: "💵 Cash on Delivery",
    payWa: "📲 WhatsApp Chat",
    proceedUpi: "Proceed to Pay via UPI ➡️",
    step2Title: "Step 2 of 2: Pay & Verify",
    backToDetails: "Back to Details",
    utrPrompt: "Enter 12-Digit Bank UTR / Ref Number:",
    utrSubtext: "After payment, enter the 12-digit UTR from your GPay, PhonePe, or Paytm receipt:",
    confirmPay: "Confirm Payment & Place Order",
    coinsEarnedMsg: "GinieCoins Available from past orders!",
    redeemCoinsText: "Redeem Coins",
  },
  hi: {
    specialOffer: "₹499 से अधिक के ऑर्डर पर मुफ्त होम डिलीवरी!",
    verified: "सत्यापित विक्रेता",
    instantWa: "तुरंत व्हाट्सएप आर्डर",
    open: "● खुला है (सुबह 9 – रात 9)",
    closed: "दुकान बंद है",
    trackOrder: "ऑर्डर ट्रैक करें",
    cart: "टोकरी (कार्ट)",
    searchPlaceholder: "सामान या सेवा खोजें...",
    allCategories: "सभी",
    addToCart: "जोड़ें",
    inStock: "उपलब्ध",
    outOfStock: "स्टॉक ख़त्म",
    deliveryPref: "डिलीवरी का प्रकार:",
    homeDelivery: "🛵 घर पर डिलीवरी",
    storePickup: "🏪 दुकान से पिकअप",
    subtotal: "सामान का मूल्य",
    deliveryFee: "डिलीवरी चार्ज",
    grandTotal: "कुल देय राशि",
    fullName: "आपका पूरा नाम",
    mobile: "व्हाट्सएप मोबाइल नंबर",
    address: "डिलीवरी का पता और पिनकोड",
    paymentMethod: "भुगतान का तरीका:",
    payUpi: "💳 UPI से पेमेंट",
    payCod: "💵 कैश ऑन डिलीवरी (COD)",
    payWa: "📲 व्हाट्सएप चैट आर्डर",
    proceedUpi: "UPI से भुगतान करें ➡️",
    step2Title: "स्टेप 2: भुगतान करें और UTR दर्ज करें",
    backToDetails: "वापस जाएँ",
    utrPrompt: "12-अंकों का बैंक UTR / रेफ़रंस नंबर दर्ज करें:",
    utrSubtext: "पेमेंट के बाद अपने GPay, PhonePe या Paytm रसीद से 12-अंकों का UTR नंबर यहाँ दर्ज करें:",
    confirmPay: "भुगतान की पुष्टि करें और ऑर्डर सबमिट करें",
    coinsEarnedMsg: "पिछले ऑर्डर्स से GinieCoins उपलब्ध हैं!",
    redeemCoinsText: "Coins का उपयोग करें",
  },
};

export default function PublicStorefrontPage() {
  const params = useParams();
  const storeId = String(params?.storeId || "");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "low" | "high">("featured");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState("");
  const [trackOrderId, setTrackOrderId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>("");

  // Feature 3: Multi-Language State
  const [lang, setLang] = useState<"en" | "hi">("en");
  const t = I18N[lang];

  // Feature 6: Customer Loyalty / Cashback Coins State
  const [loyaltyCoins, setLoyaltyCoins] = useState<number>(0);
  const [redeemCoins, setRedeemCoins] = useState<boolean>(false);
  const [loadingCoins, setLoadingCoins] = useState<boolean>(false);

  // Professional Upgrades State
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod" | "whatsapp">("upi");

  // Two-Step UPI Verification States (Order not placed until UTR is verified)
  const [checkoutStep, setCheckoutStep] = useState<"form" | "upi_pay">("form");
  const [pendingCheckoutValues, setPendingCheckoutValues] = useState<any>(null);
  const [customerUtr, setCustomerUtr] = useState<string>("");

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    totalAmount: number;
    upiUri?: string;
    qrDataUrl?: string;
    paymentMethod?: string;
    paymentUtr?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    items?: any[];
    bookingDate?: string;
    timeSlot?: string;
    couponCode?: string;
    discountAmount?: number;
    deliveryCharge?: number;
    createdAt?: string;
  } | null>(null);

  const [form] = Form.useForm();

  // Load store details
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api
      .get(`/api/storefront/${storeId}`)
      .then((res) => {
        setStore(res.data.store);
        setProducts(res.data.products || []);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const fetchLoyaltyCoins = async (phone: string) => {
    const clean = phone.replace(/\D/g, "").slice(-10);
    if (!clean || clean.length < 10 || !storeId) {
      setLoyaltyCoins(0);
      return;
    }
    try {
      setLoadingCoins(true);
      const res = await api.get(`/api/storefront/${storeId}/loyalty-coins`, {
        params: { phone: clean },
      });
      setLoyaltyCoins(Number(res.data?.availableCoins) || 0);
    } catch {
      setLoyaltyCoins(0);
    } finally {
      setLoadingCoins(false);
    }
  };

  // Auto-restore customer contact info and language from local storage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ginie_store_lang") as "en" | "hi";
      if (savedLang === "en" || savedLang === "hi") {
        setLang(savedLang);
      }
      const saved = localStorage.getItem("ginie_storefront_cust");
      if (saved) {
        const parsed = JSON.parse(saved);
        form.setFieldsValue({
          customerName: parsed.customerName || "",
          customerPhone: parsed.customerPhone || "",
          deliveryAddress: parsed.deliveryAddress || "",
        });
        if (parsed.customerPhone) {
          fetchLoyaltyCoins(parsed.customerPhone);
        }
      }
    } catch {}
  }, [form]);

  // Load booked slots when booking date changes
  useEffect(() => {
    if (!storeId || !selectedBookingDate) {
      setBookedSlots([]);
      return;
    }
    api
      .get(`/api/storefront/${storeId}/booked-slots`, { params: { date: selectedBookingDate } })
      .then((res) => setBookedSlots(res.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]));
  }, [storeId, selectedBookingDate]);

  const updateQty = (productId: string, delta: number, maxStock: number, minOrderQty = 1) => {
    const moq = Math.max(1, Number(minOrderQty) || 1);
    setCart((prev) => {
      const current = prev[productId] || 0;
      let next = current + delta;
      if (current === 0 && delta > 0) {
        next = maxStock > 0 ? Math.min(maxStock, moq) : moq;
      } else if (delta < 0 && next < moq) {
        next = 0;
      } else {
        next = Math.max(0, maxStock > 0 ? Math.min(maxStock, next) : next);
      }
      const copy = { ...prev };
      if (next === 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      return copy;
    });
  };

  const cartItems = products
    .filter((p) => (cart[p.id] || 0) > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      unit: p.unit || "pcs",
      quantity: cart[p.id],
      itemType: p.itemType || "product",
    }));

  const hasServiceInCart = cartItems.some((it) => it.itemType === "service") || store?.businessType === "services";

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100) : 0;
  const effectiveDeliveryFee = fulfillmentType === "pickup" ? 0 : cartItems.length > 0 ? Number(store?.deliveryFee) || 0 : 0;
  
  // Feature 6: Redeem Loyalty Coins calculation
  const coinsDiscount = redeemCoins ? Math.min(Math.max(0, cartSubtotal - discountAmount), loyaltyCoins) : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount - coinsDiscount + effectiveDeliveryFee);

  // Feature 2: In-Session Cart Tracking for Abandoned Cart recovery
  useEffect(() => {
    if (!storeId || cartItems.length === 0) return;
    const phone = form.getFieldValue("customerPhone");
    const clean = String(phone || "").replace(/\D/g, "").slice(-10);
    if (!clean || clean.length < 10) return;

    const timer = setTimeout(() => {
      api.post(`/api/storefront/${storeId}/cart-session`, {
        customerPhone: clean,
        customerName: form.getFieldValue("customerName") || "",
        items: cartItems,
        totalAmount: cartTotal,
        deliveryAddress: form.getFieldValue("deliveryAddress") || "",
      }).catch(() => {});
    }, 1500);

    return () => clearTimeout(timer);
  }, [storeId, cart, cartTotal, form]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category || "General")))];

  const filteredProducts = products
    .filter((p) => {
      const matchesCat = selectedCategory === "all" || (p.category || "General") === selectedCategory;
      if (!matchesCat) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "low") return Number(a.price) - Number(b.price);
      if (sortBy === "high") return Number(b.price) - Number(a.price);
      return 0;
    });

  const executeOrderSubmission = async (values: any, method: "upi" | "cod" | "whatsapp", utr?: string) => {
    setSubmitting(true);
    try {
      const deliveryNote =
        fulfillmentType === "pickup"
          ? `[Self Pickup at Store] ${values.notes || ""}`.trim()
          : `[Delivery: ${values.deliveryAddress || "N/A"}] ${values.notes || ""}`.trim();

      const res = await api.post(`/api/storefront/${storeId}/orders`, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deliveryAddress: fulfillmentType === "pickup" ? "Self Pickup at Store" : values.deliveryAddress,
        bookingDate: values.bookingDate,
        timeSlot: values.timeSlot,
        serviceMode: values.serviceMode,
        items: cartItems,
        notes: deliveryNote,
        couponCode: appliedCoupon?.code,
        paymentMethod: method,
        paymentUtr: utr ? utr.trim() : undefined,
        redeemCoins: coinsDiscount > 0 ? coinsDiscount : undefined,
      });

      const orderId = res.data.order.id;
      const totalAmount = res.data.order.totalAmount;

      // WhatsApp direct message checkout option
      if (method === "whatsapp" && store?.phone) {
        const orderSummaryText =
          `Namaste ${store.name}!\nI would like to place an order:\n\n` +
          cartItems.map((i) => `• ${i.name} (${i.quantity} ${i.unit}) — ₹${i.price * i.quantity}`).join("\n") +
          `\n\nSubtotal: ₹${cartSubtotal}\n` +
          (discountAmount > 0 ? `Coupon Discount: -₹${discountAmount}\n` : "") +
          (coinsDiscount > 0 ? `GinieCoins Redeemed: -₹${coinsDiscount}\n` : "") +
          (effectiveDeliveryFee > 0 ? `Delivery Fee: +₹${effectiveDeliveryFee}\n` : "") +
          `*Total Payable: ₹${totalAmount}*\n\n` +
          `Customer: ${values.customerName} (${values.customerPhone})\n` +
          `Fulfillment: ${fulfillmentType === "pickup" ? "Self Store Pickup" : `Home Delivery to ${values.deliveryAddress}`}\n` +
          `Order Reference: #${orderId.slice(-6).toUpperCase()}`;

        const waUrl = `https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(orderSummaryText)}`;
        window.open(waUrl, "_blank");
      }

      setOrderResult({
        orderId,
        totalAmount,
        upiUri: res.data.upiUri,
        qrDataUrl: res.data.qrDataUrl,
        paymentMethod: method,
        paymentUtr: utr ? utr.trim() : undefined,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deliveryAddress: fulfillmentType === "pickup" ? "Self Store Pickup" : values.deliveryAddress,
        items: cartItems,
        bookingDate: values.bookingDate,
        timeSlot: values.timeSlot,
        couponCode: appliedCoupon?.code,
        discountAmount: discountAmount + coinsDiscount,
        deliveryCharge: effectiveDeliveryFee,
        createdAt: new Date().toISOString(),
      });
      setCart({});
      setAppliedCoupon(null);
      setCouponInput("");
      setCheckoutStep("form");
      setCustomerUtr("");
      setRedeemCoins(false);
      setLoyaltyCoins(0);
      message.success(method === "upi" ? "UPI Payment verified & Order placed successfully!" : "Order placed successfully!");
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (values: any) => {
    if (cartItems.length === 0) return;

    // Save customer info locally for future visits
    try {
      localStorage.setItem(
        "ginie_storefront_cust",
        JSON.stringify({
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          deliveryAddress: values.deliveryAddress,
        })
      );
    } catch {}

    // Strict UPI Validation & 2-Step Gate:
    // If paying via UPI, do NOT place order in database yet.
    // Transition to Step 2 so customer scans QR/pays and enters 12-digit UTR.
    if (paymentMethod === "upi") {
      if (!store?.upiId || !store.upiId.trim()) {
        message.warning("Store has not added their UPI ID yet. Please select Cash on Delivery or WhatsApp Chat.");
        return;
      }
      setPendingCheckoutValues(values);
      setCheckoutStep("upi_pay");
      return;
    }

    // COD or WhatsApp checkout submits immediately
    await executeOrderSubmission(values, paymentMethod);
  };

  const handleConfirmUpiPayment = async () => {
    const cleanUtr = customerUtr.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      message.error("Kripya 12-digit UPI UTR / Transaction Reference number enter karein (e.g. 432198765432).");
      return;
    }
    if (!pendingCheckoutValues) {
      message.error("Order details missing. Please re-fill checkout form.");
      setCheckoutStep("form");
      return;
    }
    await executeOrderSubmission(pendingCheckoutValues, "upi", cleanUtr);
  };

  const handleTrackOrder = async () => {
    if (!trackPhone.trim()) {
      message.warning("Please enter your WhatsApp mobile number");
      return;
    }
    try {
      setTrackingLoading(true);
      const res = await api.get(`/api/storefront/${storeId}/track`, {
        params: {
          phone: trackPhone.trim(),
          orderId: trackOrderId.trim() || undefined,
        },
      });
      setTrackedOrders(res.data?.orders || []);
    } catch (err: any) {
      message.error(err.message || "Could not look up orders");
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Result
          status="404"
          title="Store Not Found"
          subTitle="This GinieSpace digital storefront link is invalid or unavailable."
          extra={
            <Space>
              <Button type="primary" href="/shop/demo" style={{ background: "#059669", borderColor: "#059669" }}>
                Explore Live Demo Store 🛍️
              </Button>
              <Button href="/dashboard">Go to Dashboard</Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 100 }}>
      {/* Top Announcement Bar with Feature 3: Multi-Language Switcher */}
      <div
        style={{
          background: "linear-gradient(90deg, #065f46 0%, #047857 50%, #059669 100%)",
          color: "#fff",
          padding: "6px 16px",
          fontSize: 12,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>🎉 <strong>{t.specialOffer}</strong></span>
          {store.coupons && store.coupons.length > 0 && (
            <Tag
              color="gold"
              style={{
                cursor: "pointer",
                fontWeight: 700,
                margin: 0,
                padding: "0 8px",
                borderRadius: 6,
              }}
              onClick={() => {
                const c = store.coupons![0];
                setCouponInput(c.code);
                setAppliedCoupon(c);
                message.success(`Coupon ${c.code} (${c.discountPercent}% OFF) ready for cart!`);
              }}
            >
              Use Code {store.coupons[0].code} ({store.coupons[0].discountPercent}% OFF) ⚡
            </Tag>
          )}
        </div>

        {/* Feature 3: Header Language Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <GlobalOutlined style={{ color: "#a7f3d0" }} />
          <Segmented
            size="small"
            value={lang}
            onChange={(val: any) => {
              setLang(val);
              try {
                localStorage.setItem("ginie_store_lang", val);
              } catch {}
            }}
            options={[
              { label: "English", value: "en" },
              { label: "हिंदी", value: "hi" },
            ]}
            style={{ background: "rgba(255, 255, 255, 0.2)", color: "#fff", fontWeight: 700 }}
          />
        </div>
      </div>

      {/* Store Cover Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
          color: "#fff",
          padding: "26px 20px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "2px solid #fff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(4px)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                {store.businessType === "restaurant" ? (
                  <CoffeeOutlined />
                ) : store.businessType === "garments" ? (
                  <SkinOutlined />
                ) : store.businessType === "hotel" ? (
                  <HomeOutlined />
                ) : store.businessType === "wholesale" ? (
                  <AppstoreOutlined />
                ) : store.businessType === "services" ? (
                  <ToolOutlined />
                ) : (
                  <ShopOutlined />
                )}
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 800 }}>
                  {store.name}
                </Title>
                <Tag
                  color="success"
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    borderRadius: 6,
                    fontSize: 11,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <SafetyCertificateFilled style={{ marginRight: 4 }} /> {t.verified}
                </Tag>
                <Tag color="gold" style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: 11 }}>
                  ⚡ {t.instantWa}
                </Tag>
                {store.isOpen === false ? (
                  <Tag color="error">{t.closed}</Tag>
                ) : (
                  <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>{t.open}</Tag>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#d1fae5", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                {store.phone && (
                  <span>
                    <PhoneOutlined /> {store.phone}
                  </span>
                )}
                {store.address && (
                  <span>
                    <EnvironmentOutlined /> {store.address}
                  </span>
                )}
                <span>
                  🏷️{" "}
                  {store.businessType === "restaurant"
                    ? "Restaurant & Food Hub"
                    : store.businessType === "garments"
                    ? "Garments & Fashion Hub"
                    : store.businessType === "hotel"
                    ? "Hotel & Homestay"
                    : store.businessType === "wholesale"
                    ? "Wholesale Hub"
                    : store.businessType === "services"
                    ? "Services & Booking Hub"
                    : "Retail Store"}
                </span>
              </div>
            </div>
          </div>

          <Space size="middle">
            <Button
              size="large"
              icon={<SearchOutlined />}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(4px)",
                fontWeight: 600,
              }}
              onClick={() => {
                setTrackedOrders(null);
                setTrackOpen(true);
              }}
            >
              {t.trackOrder}
            </Button>

            <Badge count={cartCount} showZero={false}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                style={{
                  background: "#fff",
                  color: "#065f46",
                  borderColor: "#fff",
                  fontWeight: 700,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                }}
                onClick={() => {
                  setOrderResult(null);
                  setCartOpen(true);
                }}
              >
                {t.cart} {cartTotal > 0 ? `(₹${cartTotal.toLocaleString("en-IN")})` : ""}
              </Button>
            </Badge>
          </Space>
        </div>
      </div>

      {/* Trust & Guarantee Strip */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 20px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <ThunderboltFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Instant WhatsApp Confirm</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Live updates direct to phone</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <SafetyCertificateFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>0% Convenience Fee</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Direct UPI GPay / PhonePe</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <StarFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>100% Genuine Quality</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Verified merchant partner</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Fast Delivery &amp; Pickup</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Doorstep or store takeaway</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {store.isOpen === false && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message="Store is Currently Closed"
            description={store.closedMessage || "This store is temporarily closed and not accepting new orders right now."}
          />
        )}

        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder={t.searchPlaceholder}
            allowClear
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 380 }}
          />
          <Space wrap>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 175 }}
              options={[
                { value: "featured", label: "Sort: Featured" },
                { value: "low", label: "Price: Low to High" },
                { value: "high", label: "Price: High to Low" },
              ]}
            />
            <Text type="secondary">Showing {filteredProducts.length} item(s)</Text>
          </Space>
        </div>

        {categories.length > 2 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="small"
                type={selectedCategory === cat ? "primary" : "default"}
                style={selectedCategory === cat ? { background: "#047857", borderColor: "#047857" } : undefined}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? t.allCategories : cat}
              </Button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: "center", padding: 32 }}>
            <Empty description="No products available right now" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;
              const isService = p.itemType === "service";
              const outOfStock = !isService && Number(p.stock) <= 0;
              const effectiveMax = isService ? 999 : Number(p.stock);
              const benchmarkMrp = Math.round(Number(p.price) * 1.25);
              const discountPercent = Math.round(((benchmarkMrp - Number(p.price)) / benchmarkMrp) * 100);

              return (
                <Col xs={24} sm={12} md={8} key={p.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
                    styles={{
                      body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" },
                    }}
                  >
                    <div>
                      {p.imageUrl && (
                        <div
                          style={{
                            marginBottom: 12,
                            position: "relative",
                            cursor: "pointer",
                            overflow: "hidden",
                            borderRadius: 8,
                          }}
                          onClick={() => setQuickViewProduct(p)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: 170,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #f1f5f9",
                              transition: "transform 0.3s ease",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              background: "rgba(0, 0, 0, 0.65)",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <EyeOutlined /> Quick View
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <Title
                            level={5}
                            style={{ margin: 0, cursor: "pointer" }}
                            onClick={() => setQuickViewProduct(p)}
                          >
                            {p.name}
                          </Title>
                          <Space size={4} style={{ marginTop: 4 }} wrap>
                            {isService && <Tag color="geekblue" style={{ fontSize: 11 }}>Service</Tag>}
                            {p.duration && <Tag color="cyan" style={{ fontSize: 11 }}>{p.duration}</Tag>}
                            {isService && p.serviceMode && (
                              <Tag color="purple" style={{ fontSize: 11 }}>
                                {STORE_SERVICE_MODE_TEXT[p.serviceMode] || p.serviceMode}
                              </Tag>
                            )}
                            {p.category && p.category !== "General" && (
                              <Tag color="blue" style={{ fontSize: 11 }}>{p.category}</Tag>
                            )}
                            {!isService && Number(p.stock) > 0 && Number(p.stock) <= 4 && (
                              <Tag color="orange" style={{ fontSize: 11 }}>⚡ Only {p.stock} left</Tag>
                            )}
                            {Number(p.minOrderQty) > 1 && (
                              <Tag color="purple" style={{ fontSize: 11 }}>Min Qty: {p.minOrderQty}</Tag>
                            )}
                            {p.dietary === "veg" && (
                              <Tag color="success" style={{ fontSize: 11, fontWeight: 700 }}>🟢 Pure Veg</Tag>
                            )}
                            {p.dietary === "non_veg" && (
                              <Tag color="error" style={{ fontSize: 11, fontWeight: 700 }}>🔴 Non-Veg</Tag>
                            )}
                            {p.dietary === "egg" && (
                              <Tag color="warning" style={{ fontSize: 11, fontWeight: 700 }}>🟡 Egg</Tag>
                            )}
                            {p.sizes && (
                              <Tag color="magenta" style={{ fontSize: 11 }}>Sizes: {p.sizes}</Tag>
                            )}
                            {p.colors && (
                              <Tag color="volcano" style={{ fontSize: 11 }}>Colors: {p.colors}</Tag>
                            )}
                            {p.roomType && (
                              <Tag color="cyan" style={{ fontSize: 11 }}>🏨 {p.roomType}</Tag>
                            )}
                          </Space>
                        </div>
                        <Tag color={isService ? "purple" : outOfStock ? "red" : "green"}>
                          {isService ? (lang === "hi" ? "उपलब्ध" : "Available") : outOfStock ? t.outOfStock : `${p.stock} ${p.unit} ${lang === "hi" ? "बचे हैं" : "left"}`}
                        </Tag>
                      </div>

                      <Text
                        type="secondary"
                        style={{ display: "block", marginTop: 6, minHeight: 36, fontSize: 13, cursor: "pointer" }}
                        onClick={() => setQuickViewProduct(p)}
                      >
                        {p.description || (isService ? "Book appointment online via WhatsApp" : "Available for quick WhatsApp order")}
                      </Text>
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <Text delete style={{ fontSize: 12, color: "#94a3b8" }}>
                            ₹{benchmarkMrp.toLocaleString("en-IN")}
                          </Text>
                          <Text strong style={{ fontSize: 17, color: "#0f172a" }}>
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </Text>
                          <Tag
                            color="success"
                            style={{
                              fontSize: 10,
                              padding: "0 4px",
                              lineHeight: "16px",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            {discountPercent}% OFF
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}> / {p.unit}</Text>
                      </div>

                      <Space size="small">
                        <Tooltip title="Share on WhatsApp">
                          <Button
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={() => {
                              const shareText = `Check out ${p.name} (₹${p.price}) on ${store.name}: ${typeof window !== "undefined" ? window.location.href : ""}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                            }}
                          />
                        </Tooltip>

                        {qty === 0 ? (
                          <Button
                            type="primary"
                            disabled={outOfStock}
                            icon={<PlusOutlined />}
                            style={!outOfStock ? { background: "#047857", borderColor: "#047857" } : undefined}
                            onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                          >
                            {isService ? (lang === "hi" ? "बुक करें" : "Book") : Number(p.minOrderQty) > 1 ? `${t.addToCart} (${p.minOrderQty})` : t.addToCart}
                          </Button>
                        ) : (
                          <Space>
                            <Button
                              icon={<MinusOutlined />}
                              size="small"
                              onClick={() => updateQty(p.id, -1, effectiveMax, Number(p.minOrderQty) || 1)}
                            />
                            <Text strong>{qty}</Text>
                            <Button
                              icon={<PlusOutlined />}
                              size="small"
                              disabled={qty >= effectiveMax}
                              onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                            />
                          </Space>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Product Quick View Modal */}
      <Modal
        open={Boolean(quickViewProduct)}
        onCancel={() => setQuickViewProduct(null)}
        footer={null}
        centered
        width={520}
        destroyOnClose
      >
        {quickViewProduct && (
          <div style={{ padding: "6px 0" }}>
            {quickViewProduct.imageUrl ? (
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={quickViewProduct.imageUrl}
                  alt={quickViewProduct.name}
                  style={{
                    width: "100%",
                    maxHeight: 250,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "#f8fafc",
                  }}
                />
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{quickViewProduct.name}</Title>
                <Space size={4} style={{ marginTop: 6 }} wrap>
                  {quickViewProduct.itemType === "service" && <Tag color="geekblue">Service</Tag>}
                  {quickViewProduct.duration && <Tag color="cyan">{quickViewProduct.duration}</Tag>}
                  {quickViewProduct.category && <Tag color="blue">{quickViewProduct.category}</Tag>}
                  {quickViewProduct.dietary === "veg" && <Tag color="success" style={{ fontWeight: 700 }}>🟢 Pure Veg</Tag>}
                  {quickViewProduct.dietary === "non_veg" && <Tag color="error" style={{ fontWeight: 700 }}>🔴 Non-Veg</Tag>}
                  {quickViewProduct.dietary === "egg" && <Tag color="warning" style={{ fontWeight: 700 }}>🟡 Contains Egg</Tag>}
                  {quickViewProduct.sizes && <Tag color="magenta">Sizes: {quickViewProduct.sizes}</Tag>}
                  {quickViewProduct.colors && <Tag color="volcano">Colors: {quickViewProduct.colors}</Tag>}
                  {quickViewProduct.roomType && <Tag color="cyan">🏨 {quickViewProduct.roomType}</Tag>}
                  <Tag color="green">100% Genuine</Tag>
                </Space>
              </div>
              <Tag color={quickViewProduct.itemType === "service" ? "purple" : Number(quickViewProduct.stock) > 0 ? "green" : "red"}>
                {quickViewProduct.itemType === "service"
                  ? "Available"
                  : Number(quickViewProduct.stock) > 0
                  ? `${quickViewProduct.stock} ${quickViewProduct.unit} in stock`
                  : "Out of Stock"}
              </Tag>
            </div>

            <div style={{ margin: "14px 0", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <Text delete style={{ fontSize: 13, color: "#94a3b8" }}>
                  ₹{Math.round(Number(quickViewProduct.price) * 1.25).toLocaleString("en-IN")}
                </Text>
                <Text strong style={{ fontSize: 22, color: "#0f172a" }}>
                  ₹{Number(quickViewProduct.price).toLocaleString("en-IN")}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>/ {quickViewProduct.unit}</Text>
                <Tag color="success" style={{ fontWeight: 700, borderRadius: 6 }}>20% SAVINGS</Tag>
              </div>
            </div>

            <Text type="secondary" style={{ display: "block", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              {quickViewProduct.description || "Fresh and verified quality item provided directly by the store."}
            </Text>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                style={{ flex: 1, background: "#047857", borderColor: "#047857", fontWeight: 700 }}
                disabled={quickViewProduct.itemType !== "service" && Number(quickViewProduct.stock) <= 0}
                onClick={() => {
                  updateQty(
                    quickViewProduct.id,
                    1,
                    quickViewProduct.itemType === "service" ? 999 : Number(quickViewProduct.stock),
                    Number(quickViewProduct.minOrderQty) || 1
                  );
                  setQuickViewProduct(null);
                  message.success(`Added ${quickViewProduct.name} to cart!`);
                }}
              >
                {cart[quickViewProduct.id] ? `In Cart (${cart[quickViewProduct.id]}) • Add More` : "Add to Cart"}
              </Button>

              {store?.phone && (
                <Button
                  size="large"
                  icon={<WhatsAppOutlined />}
                  style={{ color: "#25D366", borderColor: "#25D366" }}
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out ${quickViewProduct.name} (₹${quickViewProduct.price}) on ${store.name}: ${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                  target="_blank"
                >
                  Share
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile-First Sticky Floating Cart Bar */}
      {cartCount > 0 && !cartOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 0,
            right: 0,
            zIndex: 99,
            display: "flex",
            justifyContent: "center",
            padding: "0 16px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 520,
              background: "#047857",
              color: "#fff",
              borderRadius: 14,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 25px -5px rgba(4, 120, 87, 0.4), 0 8px 10px -6px rgba(4, 120, 87, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                🛒 {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>₹{cartTotal.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {fulfillmentType === "pickup" ? "Store Pickup" : "Plus delivery if applicable"}
                </div>
              </div>
            </div>

            <Button
              type="primary"
              size="middle"
              style={{
                background: "#fff",
                color: "#047857",
                borderColor: "#fff",
                fontWeight: 700,
                borderRadius: 8,
              }}
              onClick={() => {
                setOrderResult(null);
                setCartOpen(true);
              }}
            >
              View Cart →
            </Button>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Chat Help Bubble */}
      {store?.phone && (
        <a
          href={`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hi ${store.name}, I am browsing your online store (${typeof window !== "undefined" ? window.location.href : ""}) and have a question.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            bottom: cartCount > 0 ? 82 : 20,
            right: 20,
            zIndex: 90,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#25D366",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 4px 14px rgba(37, 211, 102, 0.45)",
            transition: "all 0.3s ease",
          }}
          title="Chat with Store Owner on WhatsApp"
        >
          <WhatsAppOutlined />
        </a>
      )}

      {/* Cart & Checkout Drawer */}
      <Drawer
        title={
          orderResult
            ? "Order Confirmed!"
            : checkoutStep === "upi_pay"
            ? "Pay via UPI & Confirm"
            : `Your Cart (${cartCount} items)`
        }
        placement="right"
        width={440}
        open={cartOpen}
        onClose={() => {
          setCartOpen(false);
          if (checkoutStep === "upi_pay") {
            setCheckoutStep("form");
          }
        }}
      >
        {orderResult ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: "#25D366", marginBottom: 12 }} />
            <Title level={4}>Order #{orderResult.orderId.slice(-6).toUpperCase()} Placed!</Title>
            <Text type="secondary">
              Total Payable: <Text strong>₹{Number(orderResult.totalAmount).toLocaleString("en-IN")}</Text>
            </Text>

            {orderResult.paymentMethod === "upi" ? (
              <Alert
                type="success"
                showIcon
                style={{ marginTop: 20, textAlign: "left", borderRadius: 10 }}
                message="UPI Payment Verified & Confirmed ✅"
                description={
                  <div>
                    <div>Aapka payment successfully verify ho gaya hai aur order <strong>PAID</strong> mark ho chuka hai.</div>
                    {orderResult.paymentUtr && (
                      <div style={{ marginTop: 6, padding: "4px 8px", background: "#dcfce7", borderRadius: 6, display: "inline-block", fontFamily: "monospace", fontSize: 12, color: "#166534" }}>
                        Bank UTR Ref: <strong>{orderResult.paymentUtr}</strong>
                      </div>
                    )}
                  </div>
                }
              />
            ) : orderResult.paymentMethod === "cod" ? (
              <Alert
                type="success"
                showIcon
                style={{ marginTop: 20, textAlign: "left", borderRadius: 10 }}
                message="Cash on Delivery Confirmed"
                description="Your order is registered. Please keep exact cash or UPI ready when receiving delivery or visiting the store."
              />
            ) : orderResult.qrDataUrl ? (
              <Card size="small" style={{ marginTop: 20, borderRadius: 12, background: "#f0fdf4" }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Scan &amp; Pay via any UPI App</Text>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderResult.qrDataUrl}
                  alt="UPI Payment QR"
                  style={{
                    width: 200,
                    height: 200,
                    margin: "0 auto",
                    display: "block",
                    borderRadius: 8,
                    background: "#fff",
                    padding: 6,
                  }}
                />
                {orderResult.upiUri && (
                  <Button
                    type="primary"
                    href={orderResult.upiUri}
                    style={{ marginTop: 12, background: "#16a34a", borderColor: "#16a34a" }}
                    block
                  >
                    Pay Now via UPI App
                  </Button>
                )}
              </Card>
            ) : null}

            {store.phone && (
              <Button
                icon={<WhatsAppOutlined />}
                block
                style={{ marginTop: 16 }}
                href={`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${store.name}, I placed Order #${orderResult.orderId.slice(-6).toUpperCase()} for ₹${orderResult.totalAmount}${orderResult.paymentUtr ? ` (Paid via UPI, UTR: ${orderResult.paymentUtr})` : ""}.`
                )}`}
                target="_blank"
              >
                Message Store on WhatsApp
              </Button>
            )}

            <Button
              icon={<PrinterOutlined />}
              block
              style={{ marginTop: 10, borderColor: "#059669", color: "#065f46", fontWeight: 600 }}
              onClick={() => setInvoiceModalOpen(true)}
            >
              Download Bill / Invoice (PDF)
            </Button>
          </div>
        ) : cartItems.length === 0 ? (
          <Empty description="Your cart is empty. Add products from the catalog." />
        ) : checkoutStep === "upi_pay" ? (
          <div>
            {/* Step 2: UPI Payment & UTR Entry */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => setCheckoutStep("form")}
                style={{ padding: 0, fontWeight: 600, color: "#047857" }}
              >
                {t.backToDetails}
              </Button>
              <Tag color="green" style={{ fontWeight: 700, borderRadius: 6 }}>
                {t.step2Title}
              </Tag>
            </div>

            <div style={{ textAlign: "center", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Payable to {store.name}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#059669", margin: "4px 0 12px" }}>
                ₹{cartTotal.toLocaleString("en-IN")}
              </div>

              {/* Dynamic QR Code */}
              {store?.upiId ? (
                <>
                  <div style={{ background: "#fff", padding: 10, borderRadius: 12, display: "inline-block", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", margin: "0 auto 12px" }}>
                    <QRCode
                      value={`upi://pay?pa=${encodeURIComponent(store.upiId.trim())}&pn=${encodeURIComponent(store.name)}&am=${cartTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order at ${store.name}`)}`}
                      size={180}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "#475569" }}>UPI ID: <strong>{store.upiId}</strong></span>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard?.writeText(store.upiId!);
                        message.success("UPI ID copied!");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <Button
                    type="primary"
                    icon={<MobileOutlined />}
                    block
                    href={`upi://pay?pa=${encodeURIComponent(store.upiId.trim())}&pn=${encodeURIComponent(store.name)}&am=${cartTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order at ${store.name}`)}`}
                    style={{ background: "#16a34a", borderColor: "#16a34a", height: 42, fontWeight: 700, borderRadius: 8 }}
                  >
                    📱 Pay via UPI App (GPay / PhonePe / Paytm)
                  </Button>
                </>
              ) : (
                <Alert
                  type="warning"
                  message="Store UPI ID Not Available"
                  description="Please choose Cash on Delivery or contact store directly."
                  style={{ textAlign: "left" }}
                />
              )}
            </div>

            {/* Step 2: 12-Digit UTR Input */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 4 }}>
                <CheckCircleFilled style={{ color: "#16a34a" }} />
                <span>{t.utrPrompt}</span>
              </div>
              <div style={{ fontSize: 12, color: "#15803d", marginBottom: 10, lineHeight: 1.4 }}>
                {t.utrSubtext}
              </div>
              <Input
                placeholder="e.g. 432198765432"
                maxLength={12}
                value={customerUtr}
                onChange={(e) => setCustomerUtr(e.target.value.replace(/\D/g, ""))}
                style={{
                  height: 48,
                  fontSize: 18,
                  textAlign: "center",
                  letterSpacing: 3,
                  fontWeight: 800,
                  borderRadius: 8,
                  borderColor: customerUtr.length === 12 ? "#16a34a" : undefined,
                }}
              />
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: customerUtr.length === 12 ? "#16a34a" : "#64748b", fontWeight: customerUtr.length === 12 ? 700 : 400 }}>
                  {customerUtr.length === 12 ? "✓ 12 Digits Completed" : `${customerUtr.length}/12 digits entered`}
                </span>
                <span style={{ color: "#94a3b8" }}>NPCI Standard UTR</span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={submitting}
              disabled={customerUtr.trim().length !== 12}
              onClick={handleConfirmUpiPayment}
              style={{
                height: 48,
                background: customerUtr.trim().length === 12 ? "#047857" : undefined,
                borderColor: customerUtr.trim().length === 12 ? "#047857" : undefined,
                fontWeight: 800,
                borderRadius: 8,
              }}
            >
              {t.confirmPay} (₹{cartTotal.toLocaleString("en-IN")})
            </Button>
            <Button
              type="text"
              block
              onClick={() => setCheckoutStep("form")}
              style={{ marginTop: 8, color: "#64748b" }}
            >
              Cancel / Change Payment Method
            </Button>
          </div>
        ) : (
          <div>
            {/* Fulfillment Type Toggle */}
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
                {t.deliveryPref}
              </Text>
              <Segmented
                block
                value={fulfillmentType}
                onChange={(val: any) => setFulfillmentType(val)}
                options={[
                  { label: t.homeDelivery, value: "delivery" },
                  { label: t.storePickup, value: "pickup" },
                ]}
              />
            </div>

            {/* Cart Items List */}
            <div style={{ maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ₹{item.price} x {item.quantity} {item.unit}
                    </Text>
                  </div>
                  <Text strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</Text>
                </div>
              ))}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {/* Coupon / Promo code */}
            {Array.isArray(store.coupons) && store.coupons.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <Input
                  placeholder="Promo / Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                />
                {appliedCoupon ? (
                  <Button danger onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}>
                    Remove
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const code = couponInput.trim().toUpperCase();
                      const match = store.coupons?.find((c) => c.code.toUpperCase() === code);
                      if (!match) {
                        message.error("Invalid coupon code");
                        return;
                      }
                      setAppliedCoupon(match);
                      message.success(`Coupon ${match.code} (${match.discountPercent}% off) applied!`);
                    }}
                  >
                    Apply
                  </Button>
                )}
              </div>
            )}

            {/* Feature 6: GinieCoins Loyalty Reward Banner */}
            {loyaltyCoins > 0 && (
              <div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#854d0e" }}>
                      🪙 {loyaltyCoins} GinieCoins
                    </span>
                    <div style={{ fontSize: 11, color: "#a16207" }}>
                      {t.coinsEarnedMsg}
                    </div>
                  </div>
                  <Checkbox
                    checked={redeemCoins}
                    onChange={(e) => setRedeemCoins(e.target.checked)}
                    style={{ fontWeight: 700, color: "#854d0e" }}
                  >
                    {t.redeemCoinsText} (-₹{Math.min(cartSubtotal - discountAmount, loyaltyCoins)})
                  </Checkbox>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <Text type="secondary">{t.subtotal}</Text>
                <Text>₹{cartSubtotal.toLocaleString("en-IN")}</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a" }}>
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {coinsDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ca8a04", fontWeight: 600 }}>
                  <span>GinieCoins Redeemed</span>
                  <span>-₹{coinsDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {effectiveDeliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <Text type="secondary">{t.deliveryFee}</Text>
                  <Text>+₹{effectiveDeliveryFee.toLocaleString("en-IN")}</Text>
                </div>
              )}
              {fulfillmentType === "pickup" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669" }}>
                  <span>Store Pickup</span>
                  <span>FREE</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Title level={5} style={{ margin: 0 }}>{t.grandTotal}</Title>
                <Title level={4} style={{ margin: 0, color: "#16a34a" }}>₹{cartTotal.toLocaleString("en-IN")}</Title>
              </div>
            </div>

            {/* Checkout Form */}
            <Form form={form} layout="vertical" onFinish={handleCheckout}>
              <Form.Item
                name="customerName"
                label={t.fullName}
                rules={[{ required: true, message: "Please enter your name" }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="e.g. Amit Verma" />
              </Form.Item>

              <Form.Item
                name="customerPhone"
                label={t.mobile}
                rules={[{ required: true, message: "Please enter your WhatsApp mobile number" }]}
                style={{ marginBottom: 12 }}
              >
                <Input
                  placeholder="e.g. 9876543210"
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    if (clean.length >= 10) {
                      fetchLoyaltyCoins(clean);
                    }
                  }}
                />
              </Form.Item>

              {hasServiceInCart && (
                <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8, marginBottom: 14, border: "1px solid #bbf7d0" }}>
                  <Text strong style={{ display: "block", marginBottom: 8, color: "#15803d" }}>
                    Schedule Your Appointment / Service Slot
                  </Text>
                  <Form.Item
                    name="bookingDate"
                    label="Preferred Date"
                    rules={[{ required: true, message: "Please select appointment date" }]}
                    style={{ marginBottom: 10 }}
                  >
                    <Input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setSelectedBookingDate(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item
                    name="timeSlot"
                    label="Available Time Slot"
                    rules={[{ required: true, message: "Please select a time slot" }]}
                    style={{ marginBottom: 10 }}
                  >
                    <Select
                      placeholder="Choose slot"
                      options={STORE_TIME_SLOTS.map((s) => ({
                        value: s,
                        label: bookedSlots.includes(s) ? `${s} (Already Booked)` : s,
                        disabled: bookedSlots.includes(s),
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="serviceMode" label="Service Preference" initialValue="home_visit" style={{ marginBottom: 0 }}>
                    <Select
                      options={[
                        { value: "home_visit", label: "Home / On-Site Visit" },
                        { value: "at_store", label: "Visit Store / Clinic" },
                        { value: "online", label: "Online / Video Call" },
                      ]}
                    />
                  </Form.Item>
                </div>
              )}

              {fulfillmentType === "delivery" ? (
                <Form.Item
                  name="deliveryAddress"
                  label={t.address}
                  rules={[{ required: true, message: "Please enter your delivery address" }]}
                  style={{ marginBottom: 12 }}
                >
                  <Input.TextArea rows={2} placeholder="House/Flat No, Landmark, Area, City, Pincode..." />
                </Form.Item>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12, borderRadius: 8 }}
                  message="Self Pickup at Store"
                  description={store.address ? `Pickup Address: ${store.address}` : "You can collect your items directly from the merchant."}
                />
              )}

              {/* Payment Method Switcher */}
              <div style={{ marginBottom: 14 }}>
                <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
                  {t.paymentMethod}
                </Text>
                <Segmented
                  block
                  value={paymentMethod}
                  onChange={(val: any) => setPaymentMethod(val)}
                  options={[
                    { label: t.payUpi, value: "upi" },
                    { label: t.payCod, value: "cod" },
                    { label: t.payWa, value: "whatsapp" },
                  ]}
                />
              </div>

              <Form.Item name="notes" label="Special Instructions (Optional)" style={{ marginBottom: 16 }}>
                <Input placeholder="Preferred timing or specific note..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={store.isOpen === false}
                loading={submitting}
                style={{ background: "#047857", borderColor: "#047857", fontWeight: 700 }}
              >
                {hasServiceInCart
                  ? `Confirm Booking (₹${cartTotal.toLocaleString("en-IN")})`
                  : paymentMethod === "upi"
                  ? `${t.proceedUpi} (₹${cartTotal.toLocaleString("en-IN")})`
                  : paymentMethod === "whatsapp"
                  ? `${t.payWa} (₹${cartTotal.toLocaleString("en-IN")})`
                  : `${t.confirmPay} (₹${cartTotal.toLocaleString("en-IN")})`}
              </Button>
            </Form>

            {/* Trust Footer */}
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 11,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SafetyCertificateFilled style={{ color: "#059669", fontSize: 16 }} />
              <span>
                <strong>100% Safe Checkout:</strong> Direct to store with zero convenience fee.
              </span>
            </div>
          </div>
        )}
      </Drawer>

      {/* Public Order Tracker Modal */}
      <Modal
        title="Track Your Order Status"
        open={trackOpen}
        onCancel={() => setTrackOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Input
            placeholder="Your WhatsApp Mobile Number (e.g. 9876543210)"
            value={trackPhone}
            onChange={(e) => setTrackPhone(e.target.value)}
            onPressEnter={handleTrackOrder}
          />
          <Input
            placeholder="Optional Order ID (e.g. #A1B2C3)"
            value={trackOrderId}
            onChange={(e) => setTrackOrderId(e.target.value)}
            onPressEnter={handleTrackOrder}
          />
          <Button
            type="primary"
            block
            loading={trackingLoading}
            onClick={handleTrackOrder}
            style={{ background: "#047857", borderColor: "#047857", fontWeight: 600 }}
          >
            Check Live Order Status
          </Button>

          {trackedOrders !== null && (
            trackedOrders.length === 0 ? (
              <Empty description="No matching orders found for this phone number" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {trackedOrders.map((ord) => (
                  <Card key={ord.id} size="small" style={{ borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                      <Tag color={ord.status === "delivered" ? "green" : ord.status === "cancelled" ? "red" : "blue"}>
                        {String(ord.status || "pending").toUpperCase()}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {new Date(ord.createdAt).toLocaleString()} • Total: <strong>₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}</strong> • Payment:{" "}
                      <Tag color={ord.paymentStatus === "paid" ? "green" : "orange"} style={{ marginLeft: 4 }}>
                        {String(ord.paymentStatus || "unpaid").toUpperCase()}
                      </Tag>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </Space>
      </Modal>

      <InvoiceModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        order={orderResult ? {
          id: orderResult.orderId,
          customerName: orderResult.customerName || "Customer",
          customerPhone: orderResult.customerPhone || "",
          deliveryAddress: orderResult.deliveryAddress,
          items: orderResult.items || [],
          totalAmount: orderResult.totalAmount,
          status: "confirmed",
          paymentStatus: orderResult.paymentMethod === "upi" ? "paid" : "unpaid",
          paymentUtr: orderResult.paymentUtr,
          notes: orderResult.paymentUtr ? `Payment: UPI | UTR: ${orderResult.paymentUtr}` : undefined,
          discountAmount: orderResult.discountAmount,
          deliveryCharge: orderResult.deliveryCharge,
          couponCode: orderResult.couponCode,
          bookingDate: orderResult.bookingDate,
          timeSlot: orderResult.timeSlot,
          createdAt: orderResult.createdAt || new Date().toISOString(),
        } : null}
        store={{
          name: store?.name || "Store",
          phone: store?.phone,
          address: store?.address,
          gstin: store?.gstin,
          gstRate: store?.gstRate,
          upiId: store?.upiId,
          businessType: store?.businessType,
        }}
      />
    </div>
  );
}