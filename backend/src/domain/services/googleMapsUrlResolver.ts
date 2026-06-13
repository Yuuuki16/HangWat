export type ResolvedGoogleMapsLocation = {
  name: string | null;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export interface GoogleMapsUrlResolver {
  resolve(url: string): Promise<ResolvedGoogleMapsLocation | null>;
}
