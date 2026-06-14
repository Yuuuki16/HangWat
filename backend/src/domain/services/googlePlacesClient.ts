export type GooglePlacePrediction = {
  googlePlaceId: string;
  name: string;
  address: string;
};

export type GooglePlaceDetails = {
  name: string | null;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export interface GooglePlacesClient {
  autocomplete(input: string): Promise<GooglePlacePrediction[]>;
  getDetails(googlePlaceId: string): Promise<GooglePlaceDetails | null>;
}
