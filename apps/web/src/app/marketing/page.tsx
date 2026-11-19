"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Space,
  Input,
  Tabs,
  message,
  Tooltip,
  Divider,
  Alert,
  Modal,
} from "antd";
import {
  PictureOutlined,
  WhatsAppOutlined,
  CopyOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ShopOutlined,
  FireOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { AppLayout } from "../../components/AppLayout";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

interface CreativePost {
  id: string;
  category: "festival" | "growth" | "feature" | "national";
  title: string;
  badge: string;
  badgeColor: string;
  imageUrl: string;
  downloadFilename: string;
  headline: string;
  subhead: string;
  getCustomerMessage: (bizName: string, storeUrl: string, phone: string, offerText: string) => string;
}

const CREATIVE_POSTS: CreativePost[] = [
  {
    id: "diwali",
    category: "festival",
    title: "Diwali & Dhanteras Mega Sale",
    badge: "🪔 Diwali Special",
    badgeColor: "gold",
    imageUrl: "/marketing/diwali-dhanteras.png",
    downloadFilename: "GinieSpace_Diwali_Greeting.png",
    headline: "इस दिवाली अपनी दुकान को बनाएं डिजिटल दुकान!",
    subhead: "त्योहारों की भारी भीड़ में 0% UPI बिलिंग और WhatsApp ऑर्डर से बिक्री 3x बढ़ाएं।",
    getCustomerMessage: (bizName, storeUrl, phone, offer) =>
      `🪔 *शुभ दीपावली एवं धनतेरस की हार्दिक शुभकामनाएं!* ✨\n\n` +
      `प्रिय ग्राहक,\n` +
      `${bizName} की तरफ से आपको और आपके पूरे परिवार को दीपावली की ढेर सारी शुभकामनाएं!\n\n` +
      (offer ? `🎁 *त्योहार स्पेशल ऑफर:* ${offer}\n\n` : `🎁 *त्योहार स्पेशल ऑफर:* सभी नए सामान पर खास छूट उपलब्ध है!\n\n`) +
      `दुकान पर भीड़ से बचें और घर बैठे हमारा पूरा कैटलॉग देखें:\n` +
      `👉 *ऑनलाइन कैटलॉग लिंक:* ${storeUrl}\n\n` +
      `ऑर्डर या किसी भी जानकारी के लिए हमें इसी नंबर पर WhatsApp करें।\n` +
      `धन्यवाद,\n*${bizName}* 🛍️\n📞 ${phone}`,
  },
  {
    id: "eid",
    category: "festival",
    title: "Eid Mubarak & Festive Barkat",
    badge: "🌙 Eid Mubarak",
    badgeColor: "green",
    imageUrl: "/marketing/eid-mubarak.png",
    downloadFilename: "GinieSpace_Eid_Greeting.png",
    headline: "खुशियों का त्योहार, व्यापार में बरकत!",
    subhead: "ईद पर अपने ग्राहकों को डिजिटल कैटलॉग भेजिए और भरपूर ऑर्डर्स पाइए।",
    getCustomerMessage: (bizName, storeUrl, phone, offer) =>
      `🌙 *Eid Mubarak! ईद की दिली मुबारकबाद!* 🌟\n\n` +
      `प्रिय ग्राहक,\n` +
      `${bizName} की तरफ से आपको और आपके अहलो-अयाल को ईद मुबारक!\n\n` +
      `हमारे पास ईद के लिए नए स्टॉक्स और खास कलेक्शंस आ चुके हैं।\n` +
      (offer ? `✨ *ईद स्पेशल डिस्काउंट:* ${offer}\n\n` : "") +
      `👉 *हमारा ऑनलाइन कैटलॉग देखें:* ${storeUrl}\n\n` +
      `घर बैठे अपनी पसंद का सामान चुनें और तुरंत ऑर्डर भेजें।\n` +
      `दुआओं के साथ,\n*${bizName}*\n📞 ${phone}`,
  },
  {
    id: "holi",
    category: "festival",
    title: "Holi & Spring Vyapar Sale",
    badge: "🎨 Holi Festival",
    badgeColor: "magenta",
    imageUrl: "/marketing/holi-festival.png",
    downloadFilename: "GinieSpace_Holi_Greeting.png",
    headline: "रंगों का त्योहार, व्यापार में खुशियां!",
    subhead: "पुराने बही-खाते छोड़िए, GinieSpace से WhatsApp कैटलॉग और बिलिंग अपनाइए।",
    getCustomerMessage: (bizName, storeUrl, phone, offer) =>
      `🎨 *Happy Holi! रंगों का त्योहार, खुशियों की बौछार!* 🌈\n\n` +
      `नमस्ते!\n` +
      `${bizName} की तरफ से आपको होली के पावन पर्व की बहुत-बहुत बधाई!\n\n` +
      (offer ? `🎉 *होली स्पेशल ऑफर:* ${offer}\n\n` : `🎉 *होली स्पेशल:* ताज़ा माल और बेहतरीन डिस्काउंट्स के साथ उपलब्ध!\n\n`) +
      `घर बैठे ऑनलाइन ऑर्डर करने के लिए हमारा डिजिटल स्टोर देखें:\n` +
      `👉 *कैटलॉग लिंक:* ${storeUrl}\n\n` +
      `सुरक्षित रहें, अपनों के साथ त्योहार मनाएं!\n*${bizName}*\n📞 ${phone}`,
  },
  {
    id: "new_year",
    category: "growth",
    title: "New Year & Financial Growth",
    badge: "🎉 New Year 2026",
    badgeColor: "blue",
    imageUrl: "/marketing/new-year-growth.png",
    downloadFilename: "GinieSpace_New_Year_Growth.png",
    headline: "नया साल, नया खाता, नया रिकॉर्ड!",
    subhead: "इस साल पुराने कागजी रजिस्टर छोड़िए, GinieSpace से 100% पेपरलेस बिलिंग अपनाइए।",
    getCustomerMessage: (bizName, storeUrl, phone, offer) =>
      `🎉 *नया साल, नई शुरुआत! Happy New Year!* 🚀\n\n` +
      `प्रिय ग्राहक,\n` +
      `${bizName} से जुड़ने के लिए आपका दिल से धन्यवाद! नए साल में हम आपके लिए लाए हैं बेहतर सर्विस और सुपर-फास्ट डिलीवरी।\n\n` +
      (offer ? `⭐ *New Year Offer:* ${offer}\n\n` : "") +
      `दुकान के सभी प्रोडक्ट्स और नए रेट्स ऑनलाइन देखने के लिए क्लिक करें:\n` +
      `👉 *Digital Store:* ${storeUrl}\n\n` +
      `आपका दिन शुभ हो!\n*${bizName}*\n📞 ${phone}`,
  },
  {
    id: "aatmanirbhar",
    category: "national",
    title: "Aatmanirbhar Bharat & Local Dukandar",
    badge: "🇮🇳 Swadeshi Dukan",
    badgeColor: "volcano",
    imageUrl: "/marketing/independence-aatmanirbhar.png",
    downloadFilename: "GinieSpace_Aatmanirbhar_Vyapar.png",
    headline: "आत्मनिर्भर भारत, आत्मनिर्भर दुकानदार!",
    subhead: "विदेशी ऐप्स को भारी कमीशन देना बंद करें! 100% स्वदेशी डिजिटल दुकान ऐप।",
    getCustomerMessage: (bizName, storeUrl, phone, _offer) =>
      `🇮🇳 *लोकल व्यापार, देश की शान!* 🇮🇳\n\n` +
      `नमस्ते,\n` +
      `${bizName} आपके अपने शहर की लोकल और भरोसेमंद दुकान है। हम बिना किसी बिचौलिए या एक्स्ट्रा कमीशन के आपको बेहतरीन रेट पर सामान उपलब्ध कराते हैं।\n\n` +
      `वॉकल फॉर लोकल को सपोर्ट करें और हमारे ऑनलाइन स्टोर से ऑर्डर करें:\n` +
      `👉 *विजिट करें:* ${storeUrl}\n\n` +
      `सीधे आपके घर तक फास्ट डिलीवरी!\n*${bizName}*\n📞 ${phone}`,
  },
  {
    id: "catalog",
    category: "feature",
    title: "WhatsApp Catalog & 0% UPI Invoicing",
    badge: "⚡ 24x7 Digital Store",
    badgeColor: "cyan",
    imageUrl: "/marketing/product-catalog-pos.png",
    downloadFilename: "GinieSpace_WhatsApp_Dukan.png",
    headline: "दुकान का WhatsApp कैटलॉग बनाएं 2 मिनट में!",
    subhead: "0% UPI कमीशन बिलिंग और अनलिमिटेड प्रोडक्ट्स के साथ डिजिटल दुकान शुरू करें।",
    getCustomerMessage: (bizName, storeUrl, phone, offer) =>
      `⚡ *अब हमारी दुकान का WhatsApp Catalog लाइव है!* 🛍️\n\n` +
      `नमस्ते!\n` +
      `अब आप ${bizName} से कभी भी, कहीं से भी आसानी से ऑर्डर कर सकते हैं!\n\n` +
      `✅ फोटो और रेट्स के साथ पूरे प्रोडक्ट्स\n` +
      `✅ 1-क्लिक कार्ट और ऑर्डर बुकिंग\n` +
      `✅ 0% UPI या Cash on Delivery की सुविधा\n\n` +
      (offer ? `🎁 *विशेष छूट:* ${offer}\n\n` : "") +
      `👉 *अभी कैटलॉग देखें:* ${storeUrl}\n\n` +
      `धन्यवाद,\n*${bizName}*\n📞 ${phone}`,
  },
];

export default function MarketingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [customOffer, setCustomOffer] = useState("त्योहार स्पेशल: ऑर्डर पर 5% की सीधी छूट!");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CreativePost | null>(null);

  const businessName = (user as any)?.businessName || user?.name || "Apni Dukan";
  const phone = (user as any)?.phone || "+91 92792 59690";
  const storefrontSlug = (user as any)?.storefrontSlug || (user as any)?.username || "store";
  const storeUrl = `https://app.ginie.space/s/${storefrontSlug}`;

  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return CREATIVE_POSTS;
    return CREATIVE_POSTS.filter((p) => p.category === activeTab);
  }, [activeTab]);

  const handleCopyMessage = (post: CreativePost) => {
    const text = post.getCustomerMessage(businessName, storeUrl, phone, customOffer);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      message.success("WhatsApp message copied to clipboard! Ab WhatsApp Status ya Group me paste karein.");
    } else {
      message.info("Please copy manually from the preview window.");
    }
  };

  const handleShareToWhatsApp = (post: CreativePost) => {
    const text = post.getCustomerMessage(businessName, storeUrl, phone, customOffer);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleOpenPreview = (post: CreativePost) => {
    setSelectedPost(post);
    setPreviewModalOpen(true);
  };

  return (
    <AppLayout>
      <div style={{ padding: "8px 4px 40px" }}>
        {/* Header Banner */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 12,
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)",
            color: "#fff",
            border: "none",
          }}
          styles={{ body: { padding: "24px 20px" } }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={16}>
              <Space direction="vertical" size={4}>
                <Space>
                  <Tag color="#10b981" style={{ fontWeight: 600, border: "none" }}>
                    ⭐ FESTIVE & MARKETING SUITE
                  </Tag>
                  <Tag color="#022c22" style={{ color: "#a7f3d0", border: "1px solid #10b981" }}>
                    🇮🇳 100% Free For Merchants
                  </Tag>
                </Space>
                <Title level={2} style={{ color: "#fff", margin: "8px 0 4px", fontSize: 24 }}>
                  त्योहार व मार्केटिंग पोस्ट्स (Festival & Social Creatives)
                </Title>
                <Paragraph style={{ color: "#d1fae5", fontSize: 14, margin: 0 }}>
                  अपनी दुकान के लिए त्योहारों के पोस्टर डाउनलोड करें, 1-क्लिक में WhatsApp स्टेटस पर लगाएं और ग्राहकों को घर बैठे डिजिटल कैटलॉग ऑर्डर भेजें।
                </Paragraph>
              </Space>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: "right" }}>
              <div
                style={{
                  background: "rgba(2, 44, 34, 0.6)",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  textAlign: "left",
                }}
              >
                <Text style={{ color: "#a7f3d0", fontSize: 12 }}>Aapki Dukan Ka Link:</Text>
                <div style={{ fontWeight: 600, color: "#fff", wordBreak: "break-all", fontSize: 13 }}>
                  {storeUrl}
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(storeUrl);
                      message.success("Store link copied!");
                    }}
                    style={{ background: "#10b981", borderColor: "#10b981", fontSize: 12 }}
                  >
                    Copy Link
                  </Button>
                  <Button
                    size="small"
                    icon={<ShopOutlined />}
                    onClick={() => window.open(storeUrl, "_blank")}
                    style={{ fontSize: 12 }}
                  >
                    Open Store
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Custom Offer Customizer */}
        <Card
          size="small"
          style={{ marginBottom: 20, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} sm={8}>
              <Text strong style={{ color: "#065f46" }}>
                🎁 Custom Festive Offer (संदेश में छूट जोड़ें):
              </Text>
            </Col>
            <Col xs={24} sm={16}>
              <Input
                value={customOffer}
                onChange={(e) => setCustomOffer(e.target.value)}
                placeholder="उदा. त्योहार स्पेशल: सभी सामानों पर 10% की छूट!"
                allowClear
                style={{ borderRadius: 6 }}
              />
            </Col>
          </Row>
        </Card>

        {/* Category Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "all", label: "🌟 All Posts (सभी पोस्ट्स)" },
            { key: "festival", label: "🪔 Festivals (दीपावली, ईद, होली)" },
            { key: "growth", label: "📈 New Year & Khata (नया साल व बहीखाता)" },
            { key: "national", label: "🇮🇳 Swadeshi (आत्मनिर्भर भारत)" },
            { key: "feature", label: "⚡ WhatsApp Dukan & 0% UPI" },
          ]}
          style={{ marginBottom: 16 }}
        />

        {/* Creatives Grid */}
        <Row gutter={[20, 20]}>
          {filteredPosts.map((post) => (
            <Col xs={24} sm={12} lg={8} key={post.id}>
              <Card
                hoverable
                style={{ borderRadius: 12, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
                styles={{ body: { padding: 16, display: "flex", flexDirection: "column", flex: 1 } }}
                cover={
                  <div style={{ position: "relative", background: "#0b1120", cursor: "pointer" }} onClick={() => handleOpenPreview(post)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      style={{ width: "100%", height: 260, objectFit: "cover" }}
                    />
                    <Tag
                      color={post.badgeColor}
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        fontWeight: 600,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      {post.badge}
                    </Tag>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.6)",
                        padding: "2px 8px",
                        borderRadius: 4,
                        color: "#fff",
                        fontSize: 11,
                      }}
                    >
                      1080 x 1080 HD
                    </div>
                  </div>
                }
              >
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: 16, display: "block", marginBottom: 4, color: "#1e293b" }}>
                    {post.title}
                  </Text>
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 12 }}>
                    {post.subhead}
                  </Paragraph>
                </div>

                <Divider style={{ margin: "10px 0" }} />

                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      block
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      onClick={() => handleShareToWhatsApp(post)}
                      style={{
                        background: "#25D366",
                        borderColor: "#25D366",
                        fontWeight: 600,
                      }}
                    >
                      WhatsApp Share
                    </Button>
                    <Tooltip title="Download 1080x1080 HD image for Instagram/Status">
                      <Button
                        icon={<DownloadOutlined />}
                        href={post.imageUrl}
                        download={post.downloadFilename}
                        style={{ borderColor: "#cbd5e1" }}
                      />
                    </Tooltip>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      block
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyMessage(post)}
                      style={{ fontSize: 12 }}
                    >
                      Copy Message
                    </Button>
                    <Button
                      icon={<PictureOutlined />}
                      onClick={() => handleOpenPreview(post)}
                      style={{ fontSize: 12 }}
                    >
                      Preview
                    </Button>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Merchant Tips Card */}
        <Card
          style={{ marginTop: 24, borderRadius: 12, border: "1px dashed #10b981", background: "#f0fdf4" }}
          styles={{ body: { padding: 18 } }}
        >
          <Row gutter={[16, 12]} align="middle">
            <Col xs={24} md={2}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FireOutlined style={{ fontSize: 24, color: "#15803d" }} />
              </div>
            </Col>
            <Col xs={24} md={22}>
              <Text strong style={{ fontSize: 15, color: "#166534" }}>
                💡 Dukandar Pro-Tip: WhatsApp Status Se 2x Orders Kaise Paayein?
              </Text>
              <Paragraph style={{ margin: "4px 0 0", fontSize: 13, color: "#15803d" }}>
                1. Roz subah 10 baje in festive banners ko download karke apne WhatsApp Status par lagayein.<br />
                2. Status ke caption me apna catalog link (<Text code>{storeUrl}</Text>) zaroor dalein.<br />
                3. Customer Broadcast tab se apne regular grahakon ko 1-click me festive greetings bhejein!
              </Paragraph>
            </Col>
          </Row>
        </Card>

        {/* Preview Modal */}
        <Modal
          title={
            <Space>
              <PictureOutlined style={{ color: "#10b981" }} />
              <span>{selectedPost?.title || "Banner Preview"}</span>
            </Space>
          }
          open={previewModalOpen}
          onCancel={() => setPreviewModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewModalOpen(false)}>
              Close
            </Button>,
            <Button
              key="download"
              icon={<DownloadOutlined />}
              href={selectedPost?.imageUrl}
              download={selectedPost?.downloadFilename}
            >
              Download HD
            </Button>,
            <Button
              key="whatsapp"
              type="primary"
              icon={<WhatsAppOutlined />}
              style={{ background: "#25D366", borderColor: "#25D366" }}
              onClick={() => {
                if (selectedPost) handleShareToWhatsApp(selectedPost);
              }}
            >
              Share on WhatsApp
            </Button>,
          ]}
          width={720}
        >
          {selectedPost && (
            <Row gutter={[20, 20]} style={{ marginTop: 12 }}>
              <Col xs={24} md={12}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPost.imageUrl}
                  alt={selectedPost.title}
                  style={{ width: "100%", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text strong style={{ fontSize: 13, color: "#065f46", display: "block", marginBottom: 6 }}>
                  📱 WhatsApp Message Copy (Customer Preview):
                </Text>
                <div
                  style={{
                    background: "#efeae2",
                    padding: 12,
                    borderRadius: 8,
                    maxHeight: 320,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    fontSize: 12,
                    lineHeight: 1.5,
                    border: "1px solid #dcd7ce",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {selectedPost.getCustomerMessage(businessName, storeUrl, phone, customOffer)}
                </div>
                <Button
                  block
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyMessage(selectedPost)}
                  style={{ marginTop: 10 }}
                >
                  Copy Message Text
                </Button>
              </Col>
            </Row>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
