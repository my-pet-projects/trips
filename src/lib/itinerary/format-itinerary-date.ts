export function formatItineraryDateRange(
  startDate: Date | string,
  endDate: Date | string,
): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  };
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startLabel = start.toLocaleDateString("en-US", options);
  const endLabel = end.toLocaleDateString("en-US", options);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return isNaN(date.getTime()) ? null : date;
}
