export function formatDateForInput(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0] ?? "";
}
