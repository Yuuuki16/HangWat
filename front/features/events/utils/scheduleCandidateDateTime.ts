export const buildCandidateStartAt = (eventDate: string, time: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  return `${eventDate}T${time}:00+09:00`;
};
