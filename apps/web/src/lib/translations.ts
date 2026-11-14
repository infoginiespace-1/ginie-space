export type Locale = "en" | "hi";

export interface TranslationDictionary {
  nav: {
    solutions: string;
    howItWorks: string;
    features: string;
    pricing: string;
    faq: string;
    login: string;
    getStarted: string;
    freeBadge: string;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleHighlight: string;
    titleEnd: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustText: string;
    statMerchants: string;
    statCommission: string;
    statUptime: string;
    statRetention: string;
  };
  features: {
    title: string;
    subtitle: string;
    botTitle: string;
    botDesc: string;
    catalogTitle: string;
    catalogDesc: string;
    upiTitle: string;
    upiDesc: string;
    leadsTitle: string;
    leadsDesc: string;
    privacyTitle: string;
    privacyDesc: string;
    multiDeviceTitle: string;
    multiDeviceDesc: string;
  };
  twinDevice: {
    title: string;
    subtitle: string;
    retailTab: string;
    wholesaleTab: string;
    servicesTab: string;
    leadsTab: string;
    calculatorTab: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    freeTitle: string;
    freePrice: string;
    freeDesc: string;
    freeCta: string;
    proBadge: string;
    proTitle: string;
    proPrice: string;
    proPeriod: string;
    proDesc: string;
    proCta: string;
    yearlyOffer: string;
  };
  preFooter: {
    title: string;
    subtitle: string;
    cta: string;
    supportText: string;
  };
  footer: {
    desc: string;
    solutionsTitle: string;
    merchantPortalTitle: string;
    legalTitle: string;
    trustTitle: string;
    terms: string;
    privacy: string;
    refund: string;
    disclaimer: string;
    copyright: string;
    helpline: string;
  };
}

export const translations: Record<Locale, TranslationDictionary> = {
  hi: {
    nav: {
      solutions: "Solutions",
      howItWorks: "Live Demo",
      features: "Features",
      pricing: "Pricing (₹99)",
      faq: "FAQs",
      login: "Login",
      getStarted: "Free Shuru Karein",
      freeBadge: "100% Free Tier",
    },
    hero: {
      badge: "⚡ Bharat ka Smartest WhatsApp Commerce & Billing Software",
      titleStart: "Apne WhatsApp Ko Banayein Ek",
      titleHighlight: "Automated Retail Machine",
      titleEnd: "Direct Bank UPI Billing Ke Sath",
      subtitle:
        "Bina kisi 2-3% gateway commission ke sidhe apne bank khate me payment lein. 60 second me digital catalog banayein, customer orders manage karein, aur local Google Maps se verified B2B leads payein.",
      ctaPrimary: "Abhi Free Account Banayein 🚀",
      ctaSecondary: "45-Sec Live Walkthrough 🎥",
      trustText: "Bina Credit Card • 100% Free Starter Plan • Instant QR Setup",
      statMerchants: "Active Kirana & Wholesale Sellers",
      statCommission: "Zero Gateway Commission (Direct Bank)",
      statUptime: "Persistent Cloud Session Uptime",
      statRetention: "72h Ephemeral Chat Privacy Policy",
    },
    features: {
      title: "Har Vyapari Ke Liye Complete All-in-One Engine",
      subtitle: "Bina kisi technical code ke apna pura retail, wholesale ya service business WhatsApp par automate karein.",
      botTitle: "24/7 Smart Automated Welcome & Reply Bot",
      botDesc: "Customer ke 'Hi', 'Rate List' ya 'Menu' bolte hi turant dynamic catalog aur price list send ho jati hai.",
      catalogTitle: "60-Second Digital Storefront Link",
      catalogDesc: "Swiggy/Dukaan jaisa mobile-friendly storefront jaha customer add-to-cart karke order place kar sakta hai.",
      upiTitle: "Direct Bank UPI QR (0% Gateway Cut)",
      upiDesc: "Har order par dynamic amount-locked UPI QR code banta hai. Pura paisa 100% aapke bank me bina kisi middleman ke.",
      leadsTitle: "Hyperlocal B2B Leads Finder (Google Places)",
      leadsDesc: "Apne area ke hotels, restaurants, salons, aur shops ke verified WhatsApp mobile numbers 1-click me nikaalein.",
      privacyTitle: "72-Ghante Auto-Erase Ephemeral Privacy",
      privacyDesc: "Customer chat messages 72 ghante baad database se automatic permanent delete ho jate hain. DPDP Act compliant.",
      multiDeviceTitle: "Multi-Device Persistent Cloud Session",
      multiDeviceDesc: "Ek baar WhatsApp QR scan karein, server automatically background me session reconnect aur maintain rakhta hai.",
    },
    twinDevice: {
      title: "Dekhein GinieSpace Kaise Kaam Karta Hai",
      subtitle: "Kirana stores, wholesale vyapari, aur service providers ke liye real-time interactive preview.",
      retailTab: "Kirana & Retail",
      wholesaleTab: "Wholesale & Bulk",
      servicesTab: "Salon & Services",
      leadsTab: "B2B Leads Finder",
      calculatorTab: "UPI Savings Calculator",
    },
    pricing: {
      title: "Simple, Honest & Transparent Pricing",
      subtitle: "Chhote vyapariyon ke liye permanent Free plan, growth aur bulk business ke liye affordable PRO plan.",
      freeTitle: "Free Starter Tier",
      freePrice: "₹0",
      freeDesc: "Naye shopkeepers aur initial testing ke liye perfect.",
      freeCta: "Free Me Shuru Karein",
      proBadge: "MOST POPULAR FOR GROWTH",
      proTitle: "PRO Business Growth",
      proPrice: "₹99",
      proPeriod: "/ Mahina (ya ₹999/Saal)",
      proDesc: "Serious retail, wholesale traders aur high-volume businesses ke liye.",
      proCta: "Upgrade to PRO (₹99)",
      yearlyOffer: "⚡ Yearly Plan: Sirf ₹999/Year (2 Mahina Bilkul Free)",
    },
    preFooter: {
      title: "Apne Vyapar Ko Aaj Hi Digital Aur WhatsApp-Automated Banayein!",
      subtitle: "Kewal 60 second lagte hain register karne me. Zero setup fee, zero gateway commission.",
      cta: "Create Free Account Now →",
      supportText: "Questions? Call or WhatsApp our official helpline: +91 92792 59690",
    },
    footer: {
      desc: "India's premier WhatsApp business commerce platform. Empowering retail stores, wholesale traders, and services to automate sales, collect direct UPI payments, and discover local B2B leads.",
      solutionsTitle: "Product Solutions",
      merchantPortalTitle: "Merchant Portal",
      legalTitle: "Legal & Compliance",
      trustTitle: "Security & Trust",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      refund: "Refund & Cancellation",
      disclaimer: "Legal Disclaimer: GinieSpace is an independent SaaS business automation platform developed to help Indian merchants manage their sales, catalogs, and customer communications. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC.",
      copyright: "GinieSpace. All rights reserved. Operating in India.",
      helpline: "Official Support Helpline: +91 92792 59690",
    },
  },
  en: {
    nav: {
      solutions: "Solutions",
      howItWorks: "Live Demo",
      features: "Features",
      pricing: "Pricing (₹99)",
      faq: "FAQs",
      login: "Sign In",
      getStarted: "Start Free Today",
      freeBadge: "100% Free Tier",
    },
    hero: {
      badge: "⚡ India's Smartest WhatsApp Commerce & Direct Billing Platform",
      titleStart: "Transform WhatsApp Into an",
      titleHighlight: "Autonomous Commerce Engine",
      titleEnd: "With Direct Bank UPI Billing",
      subtitle:
        "Collect direct bank payments with 0% gateway commission. Launch your mobile storefront in 60 seconds, automate customer orders, and discover verified local B2B business leads via Google Maps.",
      ctaPrimary: "Create Free Account 🚀",
      ctaSecondary: "Watch 45-Sec Demo 🎥",
      trustText: "No Credit Card Required • Permanent Free Starter Plan • Instant QR Setup",
      statMerchants: "Active Kirana & Wholesale Merchants",
      statCommission: "Zero Gateway Commission (Direct to Bank)",
      statUptime: "Persistent Cloud Linked Session Uptime",
      statRetention: "72-Hour Ephemeral Privacy Policy",
    },
    features: {
      title: "An All-in-One Engine Designed for Every Business",
      subtitle: "Automate your entire retail, wholesale, or service workflow on WhatsApp with zero technical code required.",
      botTitle: "24/7 Smart Automated Welcome & Keyword Bot",
      botDesc: "Instantly sends your digital catalog, price lists, or booking options whenever a customer messages 'Hi', 'Menu', or 'Price'.",
      catalogTitle: "60-Second Digital Storefront Link",
      catalogDesc: "A modern, mobile-friendly online shop where customers can browse items, customize carts, and place orders directly on WhatsApp.",
      upiTitle: "Direct Bank UPI QR (0% Gateway Cut)",
      upiDesc: "Generates dynamic amount-locked UPI payment QR codes. 100% of customer funds settle instantly into your bank account with zero middlemen.",
      leadsTitle: "Hyperlocal B2B Leads Discovery (Google Places)",
      leadsDesc: "Extract verified phone numbers of nearby hotels, restaurants, salons, and retail shops in one click to expand your B2B distribution.",
      privacyTitle: "72-Hour Ephemeral Chat Auto-Erase",
      privacyDesc: "Customer chat messages automatically purge from database memory after 72 hours, guaranteeing compliance with India's DPDP Act 2023.",
      multiDeviceTitle: "Persistent Cloud Multi-Device Sync",
      multiDeviceDesc: "Scan your WhatsApp QR once; our cloud infrastructure ensures resilient background reconnection with automated heartbeat monitoring.",
    },
    twinDevice: {
      title: "Experience How GinieSpace Works Live",
      subtitle: "Interactive interactive simulations for Kirana stores, wholesale distributors, and service providers.",
      retailTab: "Kirana & Retail",
      wholesaleTab: "Wholesale & Bulk",
      servicesTab: "Salon & Services",
      leadsTab: "B2B Leads Discovery",
      calculatorTab: "UPI Commission Calculator",
    },
    pricing: {
      title: "Simple, Honest & Transparent Pricing",
      subtitle: "A permanent Free plan for new merchants, and an affordable PRO tier for growing businesses.",
      freeTitle: "Free Starter Tier",
      freePrice: "₹0",
      freeDesc: "Perfect for testing and small shops getting started.",
      freeCta: "Start Free Today",
      proBadge: "MOST POPULAR FOR GROWTH",
      proTitle: "PRO Business Growth",
      proPrice: "₹99",
      proPeriod: "/ Month (or ₹999/Year)",
      proDesc: "Engineered for high-volume retailers, wholesale traders, and active brands.",
      proCta: "Upgrade to PRO (₹99)",
      yearlyOffer: "⚡ Annual Discount: Just ₹999/Year (Get 2 Months Free)",
    },
    preFooter: {
      title: "Empower Your Business with WhatsApp Automation Today!",
      subtitle: "Takes only 60 seconds to register. Zero setup fees, zero gateway deductions.",
      cta: "Create Free Account Now →",
      supportText: "Questions? Call or WhatsApp our official helpline: +91 92792 59690",
    },
    footer: {
      desc: "India's premier WhatsApp business commerce platform. Empowering retail stores, wholesale traders, and services to automate sales, collect direct UPI payments, and discover local B2B leads.",
      solutionsTitle: "Product Solutions",
      merchantPortalTitle: "Merchant Portal",
      legalTitle: "Legal & Compliance",
      trustTitle: "Security & Trust",
      terms: "Terms & Conditions",
      privacy: "Privacy Policy",
      refund: "Refund & Cancellation",
      disclaimer: "Legal Disclaimer: GinieSpace is an independent SaaS business automation platform developed to help Indian merchants manage their sales, catalogs, and customer communications. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC.",
      copyright: "GinieSpace. All rights reserved. Operating in India.",
      helpline: "Official Support Helpline: +91 92792 59690",
    },
  },
};
