export type BusinessType = "retail" | "wholesale" | "services" | "restaurant" | "garments" | "hotel";

/**
 * Checks whether Lead Discovery (Google Places B2B Search) is naturally relevant for a business category.
 * 
 * Category Analysis:
 * - wholesale: B2B suppliers needing bulk buyers (retail shops, clinics, offices, vendors). -> RELEVANT
 * - services: Commercial & corporate service providers needing contracts & business clients. -> RELEVANT
 * - retail: Local kirana & retail shops serving neighborhood footfall & walk-in customers. -> NOT RELEVANT
 * - garments: Retail fashion boutiques serving walk-in clothing shoppers. -> NOT RELEVANT
 * - restaurant: Diners, cafes, cloud kitchens serving food lovers & takeout orders. -> NOT RELEVANT
 * - hotel: Guests & travelers booking rooms and stays. -> NOT RELEVANT
 */
export function isLeadDiscoveryRelevant(businessType?: string | null): boolean {
  if (!businessType) return false;
  const normalized = businessType.toLowerCase().trim();
  return normalized === "wholesale" || normalized === "services";
}

/**
 * Determines whether the "Find New Leads" navigation item and dashboard card should be shown.
 * An explicit user setting (enableLeadDiscovery in Settings) takes precedence over the category default.
 */
export function shouldShowLeadDiscovery(
  businessType?: string | null,
  explicitOverride?: boolean | null
): boolean {
  if (typeof explicitOverride === "boolean") {
    return explicitOverride;
  }
  return isLeadDiscoveryRelevant(businessType);
}

export function getBusinessCategoryLabel(businessType?: string | null): string {
  switch (businessType?.toLowerCase().trim()) {
    case "wholesale":
      return "📦 Wholesale & Bulk B2B";
    case "services":
      return "🛠️ Services & Appointments";
    case "restaurant":
      return "🍽️ Restaurant, Cafe & Kitchen";
    case "hotel":
      return "🏨 Hotel, Homestay & Lodge";
    case "garments":
      return "👗 Garments, Boutique & Fashion";
    case "retail":
    default:
      return "🛒 Retail Store & Kirana";
  }
}

export function getBusinessHubSubtitle(businessType?: string | null): string {
  switch (businessType?.toLowerCase().trim()) {
    case "wholesale":
      return "Wholesale Hub";
    case "services":
      return "Services & Booking Hub";
    case "restaurant":
      return "Restaurant & Food Hub";
    case "hotel":
      return "Hotel & Hospitality Hub";
    case "garments":
      return "Garments & Fashion Hub";
    case "retail":
    default:
      return "Retail & Kirana Hub";
  }
}
