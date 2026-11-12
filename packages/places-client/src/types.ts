export interface PlacesSearchCriteria {
  query: string;
  area?: string;
  pincode?: string;
  city?: string;
  state?: string;
  country?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface DiscoveredLead {
  id: string; // placeId
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
}

export interface PlacesSearchResponse {
  leads: DiscoveredLead[];
  nextPageToken?: string;
}