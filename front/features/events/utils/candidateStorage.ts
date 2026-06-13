import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";

const storageKey = (eventId: string) => `hangwat:candidates:${eventId}`;

type StoredCandidate = Omit<ScheduleCandidate, "time" | "status"> & {
  time?: string;
  startAt?: string;
  status?: ScheduleCandidate["status"];
};

const normalizeTime = (candidate: StoredCandidate) => {
  if (candidate.time) {
    return candidate.time;
  }

  if (candidate.startAt?.includes("T")) {
    return candidate.startAt.split("T")[1]?.slice(0, 5) ?? "";
  }

  return candidate.startAt?.slice(0, 5) ?? "";
};

export const sortCandidatesByTime = (candidates: ScheduleCandidate[]) =>
  [...candidates].sort((left, right) => left.time.localeCompare(right.time));

export const loadCandidates = (eventId: string): ScheduleCandidate[] => {
  const storedCandidates = window.localStorage.getItem(storageKey(eventId));

  if (!storedCandidates) {
    return [];
  }

  try {
    const candidates = JSON.parse(storedCandidates) as StoredCandidate[];

    return sortCandidatesByTime(
      candidates.map((candidate) => ({
        id: candidate.id,
        title: candidate.title,
        time: normalizeTime(candidate),
        location: candidate.location,
        status: candidate.status ?? "pending",
        commentCount: candidate.commentCount,
      })),
    );
  } catch {
    return [];
  }
};

export const saveCandidates = (
  eventId: string,
  candidates: ScheduleCandidate[],
) => {
  window.localStorage.setItem(
    storageKey(eventId),
    JSON.stringify(sortCandidatesByTime(candidates)),
  );
};

export const confirmCandidate = (eventId: string, candidateId: string) => {
  const candidates = loadCandidates(eventId).map((candidate) =>
    candidate.id === candidateId
      ? { ...candidate, status: "confirmed" as const }
      : candidate,
  );

  saveCandidates(eventId, candidates);
};

export const cancelCandidateConfirmation = (
  eventId: string,
  candidateId: string,
) => {
  const candidates = loadCandidates(eventId).map((candidate) =>
    candidate.id === candidateId
      ? { ...candidate, status: "pending" as const }
      : candidate,
  );

  saveCandidates(eventId, candidates);
};

export const deleteCandidate = (eventId: string, candidateId: string) => {
  const candidates = loadCandidates(eventId).filter(
    (candidate) => candidate.id !== candidateId,
  );

  saveCandidates(eventId, candidates);
};
