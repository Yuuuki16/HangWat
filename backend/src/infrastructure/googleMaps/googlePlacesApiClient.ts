import type {
  GooglePlaceDetails,
  GooglePlacePrediction,
  GooglePlacesClient,
} from "../../domain/services/googlePlacesClient.js";

type AutocompleteResponse = {
  predictions?: Array<{
    place_id?: string;
    structured_formatting?: {
      main_text?: string;
    };
    description?: string;
  }>;
  status?: string;
};

type PlaceDetailsResponse = {
  result?: {
    name?: string;
    formatted_address?: string;
    place_id?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
    url?: string;
  };
  status?: string;
};

export class GooglePlacesApiClient implements GooglePlacesClient {
  constructor(private readonly apiKey: string) {}

  async autocomplete(input: string): Promise<GooglePlacePrediction[]> {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    );
    url.searchParams.set("input", input);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("language", "ja");

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Google Places Autocomplete API error: ${response.status}`,
      );
    }

    const data = (await response.json()) as AutocompleteResponse;

    if (!Array.isArray(data.predictions)) {
      return [];
    }

    return data.predictions
      .filter(
        (p) => typeof p.place_id === "string" && p.place_id.length > 0,
      )
      .map((p) => ({
        googlePlaceId: p.place_id as string,
        name: p.structured_formatting?.main_text ?? p.description ?? "",
        address: p.description ?? "",
      }));
  }

  async getDetails(googlePlaceId: string): Promise<GooglePlaceDetails | null> {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json",
    );
    url.searchParams.set("place_id", googlePlaceId);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("language", "ja");
    url.searchParams.set(
      "fields",
      "name,formatted_address,place_id,geometry,url",
    );

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = (await response.json()) as PlaceDetailsResponse;

    if (data.status === "NOT_FOUND" || data.status === "ZERO_RESULTS") {
      return null;
    }

    const result = data.result;
    if (result === undefined) {
      return null;
    }

    return {
      name: result.name ?? null,
      address: result.formatted_address ?? null,
      googlePlaceId: result.place_id ?? null,
      latitude: result.geometry?.location?.lat ?? null,
      longitude: result.geometry?.location?.lng ?? null,
      googleMapsUrl: result.url ?? null,
    };
  }
}
