import axios from "axios";
import { PlacesSearchCriteria, PlacesSearchResponse, DiscoveredLead } from "./types";

export class GooglePlacesClient {
  private apiKey: string;
  private endpoint = "https://places.googleapis.com/v1/places:searchText";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Google Places API Key is required");
    }
    this.apiKey = apiKey;
  }

  async searchLeads(criteria: PlacesSearchCriteria): Promise<PlacesSearchResponse> {
    const parts = [
      criteria.query,
      criteria.area,
      criteria.city,
      criteria.pincode,
      criteria.state,
      criteria.country,
    ].filter(Boolean);

    const textQuery = parts.join(", ");
    if (!textQuery.trim()) {
      return { leads: [] };
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.internationalPhoneNumber",
      "places.nationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.businessStatus",
      "places.googleMapsUri",
    ].join(",");

    try {
      const body: Record<string, any> = {
        textQuery,
        pageSize: Math.min(criteria.pageSize || 20, 20),
      };
      if (criteria.pageToken) {
        body.pageToken = criteria.pageToken;
      }

      const response = await axios.post(
        this.endpoint,
        body,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": this.apiKey,
            "X-Goog-FieldMask": fieldMask,
          },
        }
      );

      const rawPlaces = response.data?.places || [];
      const leads: DiscoveredLead[] = rawPlaces.map((p: any) => ({
        id: p.id,
        name: p.displayName?.text || "Unknown Business",
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || undefined,
        address: p.formattedAddress || undefined,
        website: p.websiteUri || undefined,
        rating: p.rating !== undefined ? Number(p.rating) : undefined,
        ratingCount: p.userRatingCount !== undefined ? Number(p.userRatingCount) : undefined,
        businessStatus: p.businessStatus || undefined,
        googleMapsUri: p.googleMapsUri || undefined,
      }));

      return {
        leads,
        nextPageToken: response.data?.nextPageToken,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message || "Failed to search places";
      throw new Error(`Google Places API Error: ${errMsg}`);
    }
  }
}