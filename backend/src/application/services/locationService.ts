import { ApplicationError } from "../errors/applicationError.js";
import type { EventMemberRepository } from "../../domain/repositories/eventMemberRepository.js";
import type {
  GoogleMapsUrlResolver,
  ResolvedGoogleMapsLocation,
} from "../../domain/services/googleMapsUrlResolver.js";
import type {
  GooglePlaceDetails,
  GooglePlacePrediction,
  GooglePlacesClient,
} from "../../domain/services/googlePlacesClient.js";

export type LocationDto = ResolvedGoogleMapsLocation;
export type GooglePlacePredictionDto = GooglePlacePrediction;
export type GooglePlaceDetailsDto = GooglePlaceDetails;

export class LocationService {
  constructor(
    private readonly googleMapsUrlResolver: GoogleMapsUrlResolver,
    private readonly eventMemberRepository: EventMemberRepository,
    private readonly googlePlacesClient: GooglePlacesClient,
  ) {}

  async resolveGoogleMapsUrl(input: { url: string }): Promise<LocationDto> {
    return this.resolve(input.url);
  }

  async resolveEventGoogleMapsUrl(input: {
    eventId: bigint;
    currentMemberId: bigint;
    url: string;
  }): Promise<LocationDto> {
    const currentMember =
      await this.eventMemberRepository.findEventMemberById(
        input.currentMemberId,
      );
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const event = await this.eventMemberRepository.findEventById(input.eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    if (currentMember.eventId !== event.id) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }

    return this.resolve(input.url);
  }

  async getGooglePlaceAutocomplete(input: {
    eventId: bigint;
    currentMemberId: bigint;
    searchInput: string;
  }): Promise<GooglePlacePredictionDto[]> {
    await this.assertEventMember(input.currentMemberId, input.eventId);
    return this.googlePlacesClient.autocomplete(input.searchInput);
  }

  async getGooglePlaceDetails(input: {
    eventId: bigint;
    currentMemberId: bigint;
    googlePlaceId: string;
  }): Promise<GooglePlaceDetailsDto> {
    await this.assertEventMember(input.currentMemberId, input.eventId);
    const details = await this.googlePlacesClient.getDetails(input.googlePlaceId);
    if (details === null) {
      throw new ApplicationError("NOT_FOUND", "場所情報を取得できません");
    }
    return details;
  }

  private async assertEventMember(
    currentMemberId: bigint,
    eventId: bigint,
  ): Promise<void> {
    const currentMember =
      await this.eventMemberRepository.findEventMemberById(currentMemberId);
    if (currentMember === null) {
      throw new ApplicationError("UNAUTHORIZED", "認証が必要です");
    }

    const event = await this.eventMemberRepository.findEventById(eventId);
    if (event === null) {
      throw new ApplicationError("NOT_FOUND", "データが存在しません");
    }

    if (currentMember.eventId !== event.id) {
      throw new ApplicationError(
        "FORBIDDEN",
        "この操作を行う権限がありません",
      );
    }
  }

  private async resolve(url: string): Promise<LocationDto> {
    const location = await this.googleMapsUrlResolver.resolve(url);
    if (location === null) {
      throw new ApplicationError("NOT_FOUND", "場所情報を取得できません");
    }

    return location;
  }
}
