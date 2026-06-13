export type EventLocationRecord = {
  name: string | null;
  address: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
};

export type EventListRecord = {
  id: bigint;
  title: string;
  eventDate: Date | null;
  location: EventLocationRecord | null;
  memberCount: number;
  confirmedCandidateId: bigint | null;
};

export interface EventRepository {
  findUserById(userId: bigint): Promise<{ id: bigint } | null>;
  findEventsByUserId(userId: bigint): Promise<EventListRecord[]>;
}
