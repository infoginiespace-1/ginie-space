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
    directSettlement: string;
    zeroCommission: string;
  };
  twinDevice: {
    tag: string;
    title: string;
    storeTab: string;
    merchantTab: string;
    hubTitle: string;
    statusLive: string;
    todayRevenue: string;
    activeProducts: string;
    localLeads: string;
    orderTitle: string;
    instantConfirmed: string;
    printBill: string;
    dispatchAlert: string;
    saveToCrm: string;
    pitchButton: string;
    customerTitle: string;
    placeOrder: string;
  };
  howItWorks: {
    tag: string;
    title: string;
    subtitle: string;
    step1Tag: string;
    step1Title: string;
    step1Desc: string;
    step1Badge: string;
    step2Tag: string;
    step2Title: string;
    step2Desc: string;
    step2Badge: string;
    step3Tag: string;
    step3Title: string;
    step3Desc: string;
    step3Badge: string;
  };
  demoTour: {
    tag: string;
    title: string;
    subtitle: string;
    tabSync: string;
    tabStore: string;
    tabLeads: string;
    tabBilling: string;
    syncTag: string;
    syncTitle: string;
    syncDesc: string;
    syncBadge1: string;
    syncBadge2: string;
    syncBadge3: string;
    syncScanTitle: string;
    syncSafeDelivery: string;
    storeTag: string;
    storeTitle: string;
    storeDesc: string;
    storeCopy: string;
    storeCopied: string;
    storePreview: string;
    leadsTag: string;
    leadsTitle: string;
    leadsDesc: string;
    leadsBadge1: string;
    leadsBadge2: string;
    leadsBadge3: string;
    leadsPitch: string;
    billingTag: string;
    billingTitle: string;
    billingDesc: string;
    billingBadge1: string;
    billingBadge2: string;
    billingBadge3: string;
  };
  solutions: {
    tag: string;
    title: string;
    subtitle: string;
    retailTitle: string;
    retailDesc: string;
    retailItems: string[];
    wholesaleTitle: string;
    wholesaleDesc: string;
    wholesaleItems: string[];
    servicesTitle: string;
    servicesDesc: string;
    servicesItems: string[];
  };
  pillars: {
    tag: string;
    title: string;
    p1Title: string;
    p1Desc: string;
    p2Title: string;
    p2Desc: string;
    p3Title: string;
    p3Desc: string;
    p4Title: string;
    p4Desc: string;
  };
  calculator: {
    tag: string;
    title: string;
    subtitle: string;
    estimatedSales: string;
    standardFee: string;
    ginieFee: string;
    savingsPrefix: string;
    savingsPerMonth: string;
    savingsPerYear: string;
  };
  pricing: {
    tag: string;
    title: string;
    subtitle: string;
    monthlyBilling: string;
    yearlyBilling: string;
    saveBadge: string;
    freeTag: string;
    freeTitle: string;
    freePrice: string;
    freePeriod: string;
    freeDesc: string;
    freeItems: string[];
    freeCta: string;
    proTag: string;
    proZeroCut: string;
    proTitle: string;
    proPriceMonthly: string;
    proPriceYearly: string;
    proPeriodMonthly: string;
    proPeriodYearly: string;
    proDesc: string;
    proItems: string[];
    proCta: string;
  };
  faqs: {
    tag: string;
    title: string;
    items: Array<{ q: string; a: string }>;
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
      directSettlement: "100% Direct Bank Settlements:",
      zeroCommission: "0% Gateway Commission",
    },
    twinDevice: {
      tag: "✨ COMPLETE OMNI-CHANNEL PERSPECTIVE",
      title: "Merchant Ka Control Panel • Grahak Ka Fast Mobile Store",
      storeTab: "📱 Customer Storefront",
      merchantTab: "💻 Merchant Hub",
      hubTitle: "GinieSpace Hub",
      statusLive: "WhatsApp Live (+91 92792 59690)",
      todayRevenue: "Aaj Ki Bikri",
      activeProducts: "Active Items",
      localLeads: "Local Leads",
      orderTitle: "Naya WhatsApp Order",
      instantConfirmed: "TURANT CONFIRMED",
      printBill: "Bill Print Karein",
      dispatchAlert: "Dispatch Alert",
      saveToCrm: "CRM Me Save Karein",
      pitchButton: "WhatsApp Pitch",
      customerTitle: "Customer Storefront",
      placeOrder: "Order Place Karein (Direct UPI)",
    },
    howItWorks: {
      tag: "⚡ ZERO TECH HASSLE",
      title: "Sirf 3 Steps Me Aapki Online Dukan Live!",
      subtitle: "Bina coding ya app download ke, direct browser me setup complete karein.",
      step1Tag: "STEP 01",
      step1Title: "1-Scan WhatsApp Sync",
      step1Desc:
        "Apne phone ka WhatsApp kholein, Linked Devices me jakar GinieSpace ka secure QR code scan karein. Sirf 10 second me multi-device sync complete.",
      step1Badge: "Cloud-Maintained Session",
      step2Tag: "STEP 02",
      step2Title: "Add Catalog & Share Link",
      step2Desc:
        "Apne products, rates aur photos add karein ya 1-click industry template pack import karein. Apna unique link WhatsApp bio me dalein.",
      step2Badge: "Shareable Storefront Link",
      step3Tag: "STEP 03",
      step3Title: "Direct Bank UPI & Orders",
      step3Desc:
        "Customer order karta hai, automatic receipt generate hoti hai jisme aapka UPI QR code hota hai. 100% paise seedhe aapke bank account me transfer hote hain.",
      step3Badge: "0% Commission Guaranteed",
    },
    demoTour: {
      tag: "🎮 INTERACTIVE FEATURE TOUR",
      title: "Dekhein GinieSpace Kaise Kaam Karta Hai",
      subtitle: "Neeche diye gaye interactive tabs par click karein aur real feature previews check karein.",
      tabSync: "1. Multi-Device Sync",
      tabStore: "2. Digital Catalog Link",
      tabLeads: "3. Hyperlocal Leads",
      tabBilling: "4. 0% Fee UPI Bills",
      syncTag: "PERSISTENT CLOUD LINK",
      syncTitle: "Phone Se Sirf 1 Baar QR Scan Karein",
      syncDesc:
        "Aapko kisi complicated API setup ya coding ki zaroorat nahi hai. Apne official phone se Linked Devices me jakar scan karein. System background me cloud socket maintain karta hai jisse aapka WhatsApp 24/7 active rehta hai.",
      syncBadge1: "✓ Real Mobile Numbers",
      syncBadge2: "✓ Cloud Background Active",
      syncBadge3: "✓ Multi-Device Protocol",
      syncScanTitle: "Apne Business Phone Se Scan Karein",
      syncSafeDelivery: "Safe Rate-Limited Delivery Active",
      storeTag: "SHAREABLE DIGITAL CATALOG",
      storeTitle: "Aapki Apni Dukan Ka Public Web Link",
      storeDesc:
        "Grahak ko koi app install nahi karni padegi. Wo aapke unique link par tap karke live catalog, wholesale MOQ ya service slots browse kar sakte hain.",
      storeCopy: "Link Copy Karein",
      storeCopied: "Copied!",
      storePreview: "Live Catalog Preview",
      leadsTag: "HYPERLOCAL B2B DISCOVERY",
      leadsTitle: "Google Places Se Naye Retailers Khojein",
      leadsDesc:
        "Apne city ya locality me specific category (e.g. 'Hardware Stores in Pune') search karein. System verified business name, address, Google star ratings aur verified phone number nikal kar deta hai.",
      leadsBadge1: "✓ Verified Phone Numbers",
      leadsBadge2: "✓ 1-Click WhatsApp Pitch",
      leadsBadge3: "✓ Direct CRM Pipeline",
      leadsPitch: "Direct WhatsApp Proposal Bhejein",
      billingTag: "100% DIRECT BANK SETTLEMENT",
      billingTitle: "0% Commission Scannable UPI Bills",
      billingDesc:
        "Grahak ke har invoice par aapka apna personal UPI QR code attach hota hai. Grahak PhonePe, Google Pay ya Paytm se scan karke direct aapke bank account me transfer karta hai.",
      billingBadge1: "✓ ₹0 Gateway Cut",
      billingBadge2: "✓ Real-time WhatsApp Receipt",
      billingBadge3: "✓ Printable GST Invoices",
    },
    solutions: {
      tag: "TAILORED FOR YOUR BUSINESS MODEL",
      title: "Ek Platform • Teeno Vyapar Ke Liye Perfect",
      subtitle:
        "Chahe aap dukan chalate ho, wholesale trading karte ho, ya home services provide karte ho — GinieSpace aapke liye custom configured hai.",
      retailTitle: "Retail & Kirana Stores",
      retailDesc:
        "Aapki physical dukan ka digital avataar. Grahak ghar baithe aapka stock browse karein aur direct WhatsApp par order dein.",
      retailItems: [
        "Instant Public Storefront Link (/shop/your-store)",
        "Photos & Stock availability tracking",
        "Scannable UPI QR on printed invoice",
        "Automated order dispatch alerts on WhatsApp",
      ],
      wholesaleTitle: "Wholesale & Distributors",
      wholesaleDesc:
        "Bulk B2B orders manage karein bina call par time waste kiye. Retailers ko carton pricing aur MOQs dikhayein.",
      wholesaleItems: [
        "Minimum Order Quantity (MOQ) enforcement",
        "Carton, Pack & Bulk Box units",
        "Hyperlocal retail buyers lead discovery",
        "Broadcast new stock arrivals to verified dealers",
      ],
      servicesTitle: "Services & Appointments",
      servicesDesc:
        "AC Repair, Salons, Coaching ya Consultancy services ke liye hassle-free slot booking aur advance UPI tokens.",
      servicesItems: [
        "Session duration (30 mins / 60 mins / AMC Plans)",
        "Home-visit vs In-store appointment modes",
        "Instant WhatsApp booking confirmation receipts",
        "Automated appointment reminder notifications",
      ],
    },
    pillars: {
      tag: "ENTERPRISE-GRADE ARCHITECTURE",
      title: "Kyun GinieSpace Har Indian Merchant Ka Pehla Choice Hai?",
      p1Title: "0% UPI Commission",
      p1Desc:
        "GinieSpace kisi payment gateway ki tarah 2-3% nahi kat-ta. Customer se 100% payment seedhe aapke apne bank UPI account me transfer hoti hai.",
      p2Title: "Multi-Device Cloud Sync",
      p2Desc:
        "Aapka WhatsApp persistently cloud se linked rehta hai. Browser refresh ya PC switch karne par session disconnect nahi hota.",
      p3Title: "Hyperlocal B2B Leads",
      p3Desc:
        "Apne shahar ya pincode ke verified businesses ko explore karein, Google review scores dekhein aur 1-click WhatsApp proposal send karein.",
      p4Title: "Staff Access Controls",
      p4Desc:
        "Billing boy ya delivery staff ke liye alag sub-accounts banayein without sharing WhatsApp session credentials ya admin settings.",
    },
    calculator: {
      tag: "💰 SAVINGS CALCULATOR",
      title: "GinieSpace Par Shifting Se Aapki Kitni Bachaat Hogi?",
      subtitle:
        "Other e-commerce gateways har transaction par 2% to 3% cut lete hain. GinieSpace par payment 100% Direct UPI hoti hai.",
      estimatedSales: "Estimated Monthly Sales:",
      standardFee: "Standard 2.5% Fee",
      ginieFee: "GinieSpace Flat Fee",
      savingsPrefix: "🎉 Aapki Seedhi Bachaat:",
      savingsPerMonth: "har mahine",
      savingsPerYear: "/saal",
    },
    pricing: {
      tag: "TRANSPARENT & AFFORDABLE PRICING",
      title: "Har Vyapari Ke Budget Me Fit",
      subtitle: "Free se shuru karein aur bina kisi contractual commitment ke jab chahein PRO upgrade karein.",
      monthlyBilling: "Monthly Billing",
      yearlyBilling: "Yearly (₹999/yr)",
      saveBadge: "Save 17%",
      freeTag: "STARTER TIER",
      freeTitle: "Free Forever",
      freePrice: "₹0",
      freePeriod: "/ forever",
      freeDesc: "Naye vyapariyo ke liye jo apna online catalog aur WhatsApp billing test karna chahte hain.",
      freeItems: [
        "Up to 15 Products / Services",
        "10 Local B2B Leads discovery",
        "1 Staff Account",
        "Live WhatsApp Web Inbox",
        "Direct Bank UPI Payments",
        "Standard Support Helpline",
      ],
      freeCta: "Free Me Shuru Karein",
      proTag: "👑 MOST POPULAR GROWTH TIER",
      proZeroCut: "0% Gateway Cut",
      proTitle: "PRO Workspace",
      proPriceMonthly: "₹99",
      proPriceYearly: "₹999",
      proPeriodMonthly: "/ month",
      proPeriodYearly: "/ year",
      proDesc: "Growing dukan aur wholesale business ke liye unlimited inventory, unlimited leads aur broadcast tools.",
      proItems: [
        "Unlimited Catalog (10,000+ items)",
        "Unlimited Local B2B Leads (10,000+ leads)",
        "5 Team Staff Seats (Billing & Delivery)",
        "Store Announcements & Broadcast Tool",
        "Verified Storefront Badge on your link",
        "Direct UPI QR + 12-Digit UTR Instant Activation",
        "Priority WhatsApp Support (+91 92792 59690)",
      ],
      proCta: "Upgrade to PRO",
    },
    faqs: {
      tag: "FREQUENTLY ASKED QUESTIONS",
      title: "Aapke Sabhi Sawal, Seedhe Aur Saaf Jawab",
      items: [
        {
          q: "GinieSpace par customer ki payment mere bank me kaise aati hai?",
          a: "Seedhe 100% aapke bank me! GinieSpace koi payment gateway middleman nahi hai jo 2% se 3% commission kate. Har invoice aur bill par aapka apna UPI QR code (aapka apna UPI ID) hota hai. Grahak PhonePe, Google Pay ya Paytm se scan karke seedhe aapke account me paise bhejta hai.",
        },
        {
          q: "WhatsApp connect karne ke liye kisi technical knowledge ki zaroorat hai?",
          a: "Bilkul nahi! Jaise aap WhatsApp Web apne computer par scan karke chalate hain, waise hi GinieSpace app me jakar sirf 1 baar QR code scan karna hota hai. Aapka WhatsApp turant sync ho jata hai aur background me orders handle karne lagta hai.",
        },
        {
          q: "Kya phone ka internet band hone par bhi GinieSpace kaam karega?",
          a: "Haan! GinieSpace cloud-synced multi-device protocol par chalta hai. Ek baar link hone ke baad aapka shareable store catalog link 24 ghante live rehta hai aur grahak kabhi bhi order place kar sakte hain.",
        },
        {
          q: "Hyperlocal B2B Leads Finder kya hai aur ye kaise kaam karta hai?",
          a: "Aap apne city ya pin code me target category (jaise 'Kirana stores in Jaipur', 'Pharmacies in Lucknow') search kar sakte hain. System aapko verified businesses ki details, Google ratings aur verified public phone numbers dikhata hai taaki aap direct 1-click WhatsApp proposal bhej sakein.",
        },
        {
          q: "₹99 PRO Plan kaise activate hota hai?",
          a: "GinieSpace app me jakar 'Upgrade to PRO' par click karein, dynamic UPI QR scan karke ₹99 (monthly) ya ₹999 (yearly) transfer karein aur apna 12-digit UTR enter karein. Admin verification ke turant baad aapka PRO plan 30 din ya 365 din ke liye unlock ho jata hai.",
        },
      ],
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
      disclaimer:
        "Legal Disclaimer: GinieSpace is an independent SaaS business automation platform developed to help Indian merchants manage their sales, catalogs, and customer communications. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC.",
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
      directSettlement: "100% Direct Bank Settlements:",
      zeroCommission: "0% Gateway Commission",
    },
    twinDevice: {
      tag: "✨ COMPLETE OMNI-CHANNEL PERSPECTIVE",
      title: "Merchant Control Hub • Fast Customer Mobile Storefront",
      storeTab: "📱 Customer Storefront",
      merchantTab: "💻 Merchant Hub",
      hubTitle: "GinieSpace Hub",
      statusLive: "WhatsApp Live (+91 92792 59690)",
      todayRevenue: "Today's Revenue",
      activeProducts: "Active Products",
      localLeads: "Local Leads",
      orderTitle: "New WhatsApp Order",
      instantConfirmed: "INSTANT CONFIRMED",
      printBill: "Print Invoice",
      dispatchAlert: "Dispatch Alert",
      saveToCrm: "Save to CRM",
      pitchButton: "WhatsApp Pitch",
      customerTitle: "Customer Storefront",
      placeOrder: "Place Order via WhatsApp (Direct UPI)",
    },
    howItWorks: {
      tag: "⚡ ZERO TECH HASSLE",
      title: "Launch Your Online WhatsApp Store in 3 Steps!",
      subtitle: "No coding, complex API setups, or bulky apps. Set up in under 60 seconds directly from your browser.",
      step1Tag: "STEP 01",
      step1Title: "1-Scan WhatsApp Sync",
      step1Desc:
        "Open WhatsApp on your mobile phone, navigate to Linked Devices, and scan GinieSpace's secure QR code. Your session establishes in under 10 seconds.",
      step1Badge: "Cloud-Maintained Session",
      step2Tag: "STEP 02",
      step2Title: "Add Catalog & Share Link",
      step2Desc:
        "Add your products, pricing, and high-res photos or import our 1-click industry template packs. Share your unique link in your WhatsApp bio.",
      step2Badge: "Shareable Storefront Link",
      step3Tag: "STEP 03",
      step3Title: "Direct Bank UPI & Orders",
      step3Desc:
        "When customers order, instant branded receipts generate with your amount-locked UPI QR code. 100% of payment settles directly into your bank.",
      step3Badge: "0% Commission Guaranteed",
    },
    demoTour: {
      tag: "🎮 INTERACTIVE FEATURE TOUR",
      title: "Experience How GinieSpace Works Live",
      subtitle: "Click through the interactive feature tabs below to see live previews of every major workflow.",
      tabSync: "1. Multi-Device Sync",
      tabStore: "2. Digital Catalog Link",
      tabLeads: "3. Hyperlocal Leads",
      tabBilling: "4. 0% Fee UPI Bills",
      syncTag: "PERSISTENT CLOUD LINK",
      syncTitle: "Scan QR Code Once From Your Phone",
      syncDesc:
        "No complex WhatsApp Cloud API approvals or Meta verification delays. Link your official business phone just like WhatsApp Web. Our resilient background cloud socket maintains your session 24/7.",
      syncBadge1: "✓ Real Mobile Numbers",
      syncBadge2: "✓ Resilient Cloud Session",
      syncBadge3: "✓ Multi-Device Protocol",
      syncScanTitle: "Scan & Link Your Business Phone",
      syncSafeDelivery: "Safe Rate-Limited Delivery Active",
      storeTag: "SHAREABLE DIGITAL CATALOG",
      storeTitle: "Your Own Modern Online Web Shop",
      storeDesc:
        "Customers don't need to install any app. They simply tap your link to browse live inventory, bulk wholesale MOQ tiers, or service time slots.",
      storeCopy: "Copy Store Link",
      storeCopied: "Copied!",
      storePreview: "Live Catalog Preview",
      leadsTag: "HYPERLOCAL B2B DISCOVERY",
      leadsTitle: "Discover Nearby Retailers on Google Places",
      leadsDesc:
        "Search any product category in your city or postal code (e.g., 'Hardware Stores in Pune'). The system extracts verified business names, addresses, Google reviews, and direct phone numbers.",
      leadsBadge1: "✓ Verified Phone Numbers",
      leadsBadge2: "✓ 1-Click WhatsApp Pitch",
      leadsBadge3: "✓ Direct CRM Pipeline",
      leadsPitch: "Send Direct WhatsApp Proposal",
      billingTag: "100% DIRECT BANK SETTLEMENT",
      billingTitle: "0% Commission Scannable UPI Bills",
      billingDesc:
        "Every invoice carries your dedicated personal UPI QR code. Customers pay via PhonePe, Google Pay, or Paytm directly into your verified bank account with zero platform cut.",
      billingBadge1: "✓ ₹0 Gateway Cut",
      billingBadge2: "✓ Real-time WhatsApp Receipt",
      billingBadge3: "✓ Printable GST Invoices",
    },
    solutions: {
      tag: "TAILORED FOR YOUR BUSINESS MODEL",
      title: "One Platform • Built for Three Commerce Types",
      subtitle:
        "Whether you manage a local retail shop, wholesale distribution, or appointments and services — GinieSpace adapts seamlessly.",
      retailTitle: "Retail & Kirana Stores",
      retailDesc:
        "The digital avatar of your neighborhood store. Let regular customers browse your inventory from home and place instant orders on WhatsApp.",
      retailItems: [
        "Instant Public Storefront Link (/shop/your-store)",
        "Photos & Stock availability tracking",
        "Scannable UPI QR on printed invoice",
        "Automated order dispatch alerts on WhatsApp",
      ],
      wholesaleTitle: "Wholesale & Distributors",
      wholesaleDesc:
        "Handle bulk B2B purchase orders without repetitive phone calls. Showcase carton rates, tier discounts, and minimum order quantities.",
      wholesaleItems: [
        "Minimum Order Quantity (MOQ) enforcement",
        "Carton, Pack & Bulk Box units",
        "Hyperlocal retail buyers lead discovery",
        "Broadcast new stock arrivals to verified dealers",
      ],
      servicesTitle: "Services & Appointments",
      servicesDesc:
        "Hassle-free slot bookings and advance UPI deposits for AC technicians, beauty salons, coaching, and professional consultants.",
      servicesItems: [
        "Session duration (30 mins / 60 mins / AMC Plans)",
        "Home-visit vs In-store appointment modes",
        "Instant WhatsApp booking confirmation receipts",
        "Automated appointment reminder notifications",
      ],
    },
    pillars: {
      tag: "ENTERPRISE-GRADE ARCHITECTURE",
      title: "Why Thousands of Merchants Choose GinieSpace",
      p1Title: "0% UPI Commission",
      p1Desc:
        "GinieSpace never takes a 2-3% platform cut. 100% of customer payments settle directly into your linked bank UPI account instantly.",
      p2Title: "Multi-Device Cloud Sync",
      p2Desc:
        "Your WhatsApp stays securely connected through our cloud backend. Refreshing your browser or switching devices never interrupts operations.",
      p3Title: "Hyperlocal B2B Leads",
      p3Desc:
        "Discover verified local business prospects across your pincode, view ratings, and send targeted 1-click WhatsApp catalog proposals.",
      p4Title: "Staff Access Controls",
      p4Desc:
        "Provide billing and delivery assistants dedicated team sub-accounts without sharing your master WhatsApp session credentials.",
    },
    calculator: {
      tag: "💰 SAVINGS CALCULATOR",
      title: "Calculate Your Direct UPI Payment Savings",
      subtitle:
        "Traditional e-commerce platforms charge 2% to 3% gateway deductions per transaction. GinieSpace gives you 100% Direct UPI settlements.",
      estimatedSales: "Estimated Monthly Sales:",
      standardFee: "Standard 2.5% Gateway Fee",
      ginieFee: "GinieSpace Flat Fee",
      savingsPrefix: "🎉 Your Direct Savings:",
      savingsPerMonth: "per month",
      savingsPerYear: "/year",
    },
    pricing: {
      tag: "TRANSPARENT & AFFORDABLE PRICING",
      title: "Transparent Plans for Every Business Stage",
      subtitle: "Start completely free and upgrade to PRO when your volume scales — with zero lock-in contracts.",
      monthlyBilling: "Monthly Billing",
      yearlyBilling: "Yearly (₹999/yr)",
      saveBadge: "Save 17%",
      freeTag: "STARTER TIER",
      freeTitle: "Free Forever",
      freePrice: "₹0",
      freePeriod: "/ forever",
      freeDesc: "Ideal for new shopkeepers and small merchants testing WhatsApp storefront catalog sales.",
      freeItems: [
        "Up to 15 Products / Services",
        "10 Local B2B Leads discovery",
        "1 Staff Account",
        "Live WhatsApp Web Inbox",
        "Direct Bank UPI Payments",
        "Standard Support Helpline",
      ],
      freeCta: "Start Free Account",
      proTag: "👑 MOST POPULAR GROWTH TIER",
      proZeroCut: "0% Gateway Cut",
      proTitle: "PRO Workspace",
      proPriceMonthly: "₹99",
      proPriceYearly: "₹999",
      proPeriodMonthly: "/ month",
      proPeriodYearly: "/ year",
      proDesc: "Engineered for active retailers and wholesale distributors requiring unlimited inventory, leads, and broadcasts.",
      proItems: [
        "Unlimited Catalog (10,000+ items)",
        "Unlimited Local B2B Leads (10,000+ leads)",
        "5 Team Staff Seats (Billing & Delivery)",
        "Store Announcements & Broadcast Tool",
        "Verified Storefront Badge on your link",
        "Direct UPI QR + 12-Digit UTR Instant Activation",
        "Priority WhatsApp Support (+91 92792 59690)",
      ],
      proCta: "Upgrade to PRO",
    },
    faqs: {
      tag: "FREQUENTLY ASKED QUESTIONS",
      title: "Clear, Honest Answers to Common Merchant Questions",
      items: [
        {
          q: "How do customer payments reach my bank account with GinieSpace?",
          a: "100% directly into your bank! GinieSpace is not an escrow payment gateway and charges 0% transaction cuts. Each invoice generates your dedicated UPI QR code. Customers pay via PhonePe, Google Pay, or Paytm directly to your account.",
        },
        {
          q: "Do I need technical skills or coding to connect my WhatsApp?",
          a: "Not at all! Just like logging into WhatsApp Web on a laptop, you scan our QR code once from your phone's 'Linked Devices' screen. Your WhatsApp connects instantly and handles incoming orders automatically in the background.",
        },
        {
          q: "Will my digital catalog storefront work if my phone goes offline?",
          a: "Yes! GinieSpace utilizes a cloud-synced multi-device protocol. Once linked, your public storefront link (/shop/your-store) stays live 24/7 so customers can browse and place orders anytime.",
        },
        {
          q: "What is the Hyperlocal B2B Leads Finder and how does it work?",
          a: "You can search specific business categories in any city or PIN code (such as 'Kirana stores in Jaipur' or 'Pharmacies in Lucknow'). The system extracts verified public listings with Google ratings and contact numbers so you can send direct 1-click proposals.",
        },
        {
          q: "How does the ₹99 PRO Plan activation work?",
          a: "Click 'Upgrade to PRO' in your dashboard, scan the dynamic UPI QR code to pay ₹99 (monthly) or ₹999 (yearly), and enter the 12-digit UPI UTR. Upon automatic verification, all PRO features unlock immediately for 30 or 365 days.",
        },
      ],
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
      disclaimer:
        "Legal Disclaimer: GinieSpace is an independent SaaS business automation platform developed to help Indian merchants manage their sales, catalogs, and customer communications. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC.",
      copyright: "GinieSpace. All rights reserved. Operating in India.",
      helpline: "Official Support Helpline: +91 92792 59690",
    },
  },
};
