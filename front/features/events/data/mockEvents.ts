import type { Event } from "@/features/events/types/event";

export const mockEvents: Event[] = [
  {
    id: "park-golf",
    title: "パークゴルフ",
    date: "7月31日(水)",
    location: "大阪府",
    canDelete: true,
  },
  {
    id: "izakaya",
    title: "居酒屋",
    date: "7月31日(水)",
    location: "大阪府",
    canDelete: false,
  },
];
