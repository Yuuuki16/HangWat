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

describe("LocationService", () => {
  it("resolves Google Maps URL for logged-in user use case", async () => {
    const resolver = new FakeGoogleMapsUrlResolver();
    const service = new LocationService(resolver, createRepository());

    const location = await service.resolveGoogleMapsUrl({
      url: "https://maps.app.goo.gl/xxxxxx",
    });

    assert.equal(location.name, "大阪駅");
    assert.deepEqual(resolver.resolvedUrls, ["https://maps.app.goo.gl/xxxxxx"]);
  });

  it("returns not found when location cannot be resolved", async () => {
    const resolver = new FakeGoogleMapsUrlResolver();
    resolver.result = null;
    const service = new LocationService(resolver, createRepository());

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
    const service = new LocationService(resolver, createRepository());

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
    const service = new LocationService(
      new FakeGoogleMapsUrlResolver(),
      createRepository(),
    );

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
    const service = new LocationService(
      new FakeGoogleMapsUrlResolver(),
      createRepository(),
    );

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
    const service = new LocationService(
      new FakeGoogleMapsUrlResolver(),
      createRepository(),
    );

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
});
