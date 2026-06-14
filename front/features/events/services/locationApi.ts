import { type ApiResult, request } from "@/features/events/services/apiUtils";

export type ResolvedLocation = {
  name: string;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type PlacePrediction = {
  googlePlaceId: string;
  name: string;
  address: string;
};

export type ResolveLocationResult = ApiResult<{ location: ResolvedLocation }>;
export type PlaceAutocompleteResult = ApiResult<{
  predictions: PlacePrediction[];
}>;

const memberHeader = (memberId: string) => ({ "x-event-member-id": memberId });

export async function resolveGoogleMapsUrl(
  url: string,
): Promise<ResolveLocationResult> {
  return request(
    "/api/locations/resolve-google-maps-url",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    },
    "場所情報の取得に失敗しました",
  );
}

export async function resolveEventGoogleMapsUrl(
  eventId: string,
  memberId: string,
  url: string,
): Promise<ResolveLocationResult> {
  return request(
    `/api/events/${encodeURIComponent(eventId)}/locations/resolve-google-maps-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...memberHeader(memberId) },
      body: JSON.stringify({ url }),
    },
    "場所情報の取得に失敗しました",
  );
}

export async function getGooglePlaceAutocomplete(
  eventId: string,
  memberId: string,
  input: string,
): Promise<PlaceAutocompleteResult> {
  const query = new URLSearchParams({ input }).toString();
  return request(
    `/api/events/${encodeURIComponent(eventId)}/locations/google-place-autocomplete?${query}`,
    { method: "GET", headers: memberHeader(memberId) },
    "場所候補の取得に失敗しました",
  );
}

export async function getGooglePlaceDetails(
  eventId: string,
  memberId: string,
  googlePlaceId: string,
): Promise<ResolveLocationResult> {
  const query = new URLSearchParams({ googlePlaceId }).toString();
  return request(
    `/api/events/${encodeURIComponent(eventId)}/locations/google-place-details?${query}`,
    { method: "GET", headers: memberHeader(memberId) },
    "場所情報の取得に失敗しました",
  );
}
