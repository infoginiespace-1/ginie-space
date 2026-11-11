export * from "./types";
export * from "./client";

import { GooglePlacesClient } from "./client";

export function createPlacesClient(apiKey: string): GooglePlacesClient {
  return new GooglePlacesClient(apiKey);
}