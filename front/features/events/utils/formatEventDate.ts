const eventDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function formatEventDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return "日付不明";
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const eventDate = new Date(year, month - 1, day);

  const isValidDate =
    eventDate.getFullYear() === year &&
    eventDate.getMonth() === month - 1 &&
    eventDate.getDate() === day;

  return isValidDate ? eventDateFormatter.format(eventDate) : "日付不明";
}
