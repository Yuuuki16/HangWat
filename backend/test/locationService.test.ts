import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { LocationService } from "../src/application/services/locationService.js";
import type {
  CurrentEventMember,
  EventMemberRecord,
  EventMemberRepository,
} from "../src/domain/repositories/eventMemberRepository.js";
import type {
  GoogleMapsUrlResolver,
  ResolvedGoogleMapsLocation,
} from "../src/domain/services/googleMapsUrlResolver.js";
import type {
  GooglePlaceDetails,
  GooglePlacePrediction,
  GooglePlacesClient,
} from "../src/domain/services/googlePlacesClient.js";

class FakeGoogleMapsUrlResolver implements GoogleMapsUrlResolver {
  result: ResolvedGoogleMapsLocation | null = {
    name: "大阪駅",
    address: "大阪府大阪市北区梅田3丁目1-1",
    googlePlaceId: "ChIJxxxxxxxxxxxx",
    latitude: 34.702485,
    longitude: 135.495951,
    googleMapsUrl: "https://www.google.com/maps/place/osaka",
  };
  resolvedUrls: string[] = [];

  async resolve(url: string) {
    this.resolvedUrls.push(url);
    return this.result;
  }
}

class FakeGooglePlacesClient implements GooglePlacesClient {
  predictions: GooglePlacePrediction[] = [
    {
      googlePlaceId: "ChIJyyyy",
      name: "一蘭 梅田店",
      address: "大阪府大阪市北区梅田1丁目",
    },
  ];
  details: GooglePlaceDetails | null = {
    name: "一蘭 梅田店",
    address: "大阪府大阪市北区梅田1丁目",
    googlePlaceId: "ChIJyyyy",
    latitude: 34.701111,
    longitude: 135.500111,
    googleMapsUrl: "https://www.google.com/maps/place/ichiran",
  };
  autocompleteInputs: string[] = [];
  detailsInputs: string[] = [];

  async autocomplete(input: string) {
    this.autocompleteInputs.push(input);
    return this.predictions;
  }

  async getDetails(googlePlaceId: string) {
    this.detailsInputs.push(googlePlaceId);
    return this.details;
  }
}

class FakeEventMemberRepository implements EventMemberRepository {
  readonly eventMembers = new Map<string, CurrentEventMember>();
  readonly events = new Map<string, { id: bigint }>();

  async findEventMemberById(eventMemberId: bigint) {
    return this.eventMembers.get(eventMemberId.toString()) ?? null;
  }

  async findEventById(eventId: bigint) {
    return this.events.get(eventId.toString()) ?? null;
  }

  async findMembersByEventId(): Promise<EventMemberRecord[]> {
    return [];
  }
}

function createRepository() {
  const repository = new FakeEventMemberRepository();
  repository.events.set("1", { id: 1n });
  repository.events.set("2", { id: 2n });
  repository.eventMembers.set("10", {
    id: 10n,
    eventId: 1n,
    userId: 1n,
    displayName: "はせたく",
    role: "OWNER",
  });

  return repository;
}

function createService(
  resolver?: FakeGoogleMapsUrlResolver,
  placesClient?: FakeGooglePlacesClient,
) {
  return new LocationService(
    resolver ?? new FakeGoogleMapsUrlResolver(),
    createRepository(),
    placesClient ?? new FakeGooglePlacesClient(),
  );
}

describe("LocationService", () => {
  it("resolves Google Maps URL for logged-in user use case", async () => {
    const resolver = new FakeGoogleMapsUrlResolver();
    const service = createService(resolver);

    const location = await service.resolveGoogleMapsUrl({
      url: "https://maps.app.goo.gl/xxxxxx",
    });

    assert.equal(location.name, "大阪駅");
    assert.deepEqual(resolver.resolvedUrls, ["https://maps.app.goo.gl/xxxxxx"]);
  });

  it("returns not found when location cannot be resolved", async () => {
    const resolver = new FakeGoogleMapsUrlResolver();
    resolver.result = null;
    const service = createService(resolver);

    await assert.rejects(
      () =>
        service.resolveGoogleMapsUrl({
          url: "https://maps.app.goo.gl/xxxxxx",
        }),
      { name: "ApplicationError", code: "NOT_FOUND" },
    );
  });

  it("resolves Google Maps URL for an event member", async () => {
    const resolver = new FakeGoogleMapsUrlResolver();
    const service = createService(resolver);

    const location = await service.resolveEventGoogleMapsUrl({
      eventId: 1n,
      currentMemberId: 10n,
      url: "https://www.google.com/maps/place/osaka",
    });

    assert.equal(location.googlePlaceId, "ChIJxxxxxxxxxxxx");
    assert.deepEqual(resolver.resolvedUrls, [
      "https://www.google.com/maps/place/osaka",
    ]);
  });

  it("returns unauthorized when current member is unknown", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.resolveEventGoogleMapsUrl({
          eventId: 1n,
          currentMemberId: 999n,
          url: "https://www.google.com/maps/place/osaka",
        }),
      { name: "ApplicationError", code: "UNAUTHORIZED" },
    );
  });

  it("returns not found when event does not exist", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.resolveEventGoogleMapsUrl({
          eventId: 999n,
          currentMemberId: 10n,
          url: "https://www.google.com/maps/place/osaka",
        }),
      { name: "ApplicationError", code: "NOT_FOUND" },
    );
  });

  it("returns forbidden when current member belongs to another event", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.resolveEventGoogleMapsUrl({
          eventId: 2n,
          currentMemberId: 10n,
          url: "https://www.google.com/maps/place/osaka",
        }),
      { name: "ApplicationError", code: "FORBIDDEN" },
    );
  });

  it("returns Google Place autocomplete predictions for event member", async () => {
    const placesClient = new FakeGooglePlacesClient();
    const service = createService(undefined, placesClient);

    const result = await service.getGooglePlaceAutocomplete({
      eventId: 1n,
      currentMemberId: 10n,
      searchInput: "一蘭",
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].googlePlaceId, "ChIJyyyy");
    assert.equal(result[0].name, "一蘭 梅田店");
    assert.deepEqual(placesClient.autocompleteInputs, ["一蘭"]);
  });

  it("returns unauthorized when current member is unknown (autocomplete)", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.getGooglePlaceAutocomplete({
          eventId: 1n,
          currentMemberId: 999n,
          searchInput: "一蘭",
        }),
      { name: "ApplicationError", code: "UNAUTHORIZED" },
    );
  });

  it("returns not found when event does not exist (autocomplete)", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.getGooglePlaceAutocomplete({
          eventId: 999n,
          currentMemberId: 10n,
          searchInput: "一蘭",
        }),
      { name: "ApplicationError", code: "NOT_FOUND" },
    );
  });

  it("returns forbidden when current member belongs to another event (autocomplete)", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.getGooglePlaceAutocomplete({
          eventId: 2n,
          currentMemberId: 10n,
          searchInput: "一蘭",
        }),
      { name: "ApplicationError", code: "FORBIDDEN" },
    );
  });

  it("returns Google Place details for event member", async () => {
    const placesClient = new FakeGooglePlacesClient();
    const service = createService(undefined, placesClient);

    const location = await service.getGooglePlaceDetails({
      eventId: 1n,
      currentMemberId: 10n,
      googlePlaceId: "ChIJyyyy",
    });

    assert.equal(location.name, "一蘭 梅田店");
    assert.equal(location.latitude, 34.701111);
    assert.deepEqual(placesClient.detailsInputs, ["ChIJyyyy"]);
  });

  it("returns not found when place details are null", async () => {
    const placesClient = new FakeGooglePlacesClient();
    placesClient.details = null;
    const service = createService(undefined, placesClient);

    await assert.rejects(
      () =>
        service.getGooglePlaceDetails({
          eventId: 1n,
          currentMemberId: 10n,
          googlePlaceId: "ChIJzzzz",
        }),
      { name: "ApplicationError", code: "NOT_FOUND" },
    );
  });

  it("returns unauthorized when current member is unknown (place details)", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.getGooglePlaceDetails({
          eventId: 1n,
          currentMemberId: 999n,
          googlePlaceId: "ChIJyyyy",
        }),
      { name: "ApplicationError", code: "UNAUTHORIZED" },
    );
  });

  it("returns forbidden when current member belongs to another event (place details)", async () => {
    const service = createService();

    await assert.rejects(
      () =>
        service.getGooglePlaceDetails({
          eventId: 2n,
          currentMemberId: 10n,
          googlePlaceId: "ChIJyyyy",
        }),
      { name: "ApplicationError", code: "FORBIDDEN" },
    );
  });
});
