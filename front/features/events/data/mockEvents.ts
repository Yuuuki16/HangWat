import type { Event } from "@/features/events/types/event";

export const mockEvents: Event[] = [
  {
    id: "park-golf",
    title: "パークゴルフ",
    date: "2026-07-31",
    location: "大阪府",
    details: "みんなでパークゴルフを楽しみましょう",
    participantCount: 0,
    participationUrl: "https://example.com/park-golf",
    myRole: "owner",
  },
  {
    id: "izakaya",
    title: "居酒屋",
    date: "2026-07-31",
    location: "大阪府",
    details: "駅前のお店で集まります",
    participantCount: 4,
    participationUrl: "https://example.com/izakaya",
    myRole: "member",
  },
];
