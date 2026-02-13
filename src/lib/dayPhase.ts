export type DayPhase =
  | "Morning"
  | "Noon"
  | "Evening"
  | "Sun Down"
  | "Night"
  | "Midnight";

export function getDayPhase(date: Date = new Date()): DayPhase {
  const hour = date.getHours();

  if (hour < 4) return "Midnight";
  if (hour < 11) return "Morning";
  if (hour < 14) return "Noon";
  if (hour < 18) return "Evening";
  if (hour < 21) return "Sun Down";
  return "Night";
}
