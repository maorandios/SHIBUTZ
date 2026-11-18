const HEBREW_WEEKDAYS = [
  "יום ראשון",
  "יום שני",
  "יום שלישי",
  "יום רביעי",
  "יום חמישי",
  "יום שישי",
  "יום שבת",
];

export const HEBREW_WEEKDAY_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

/** Local calendar date as YYYY-MM-DD (never UTC via toISOString). */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayLocal(): string {
  return formatLocalDate(new Date());
}

export function tomorrowLocal(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return formatLocalDate(date);
}

export function shiftLocalDate(dateKey: string, days: number): string {
  const date = parseLocalDate(dateKey);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function previousDay(dateKey: string): string {
  return shiftLocalDate(dateKey, -1);
}

export function nextDay(dateKey: string): string {
  return shiftLocalDate(dateKey, 1);
}

/** Compact display: 19.11.2026 */
export function formatDisplayDate(dateKey: string): string {
  const date = parseLocalDate(dateKey);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/** Human-readable Hebrew: יום חמישי, 19.11.2026 */
export function formatHebrewDate(dateKey: string): string {
  const date = parseLocalDate(dateKey);
  return `${HEBREW_WEEKDAYS[date.getDay()]}, ${formatDisplayDate(dateKey)}`;
}

export function formatHebrewMonthYear(year: number, monthIndex: number): string {
  return `${HEBREW_MONTHS[monthIndex]} ${year}`;
}

export function shiftMonth(
  year: number,
  monthIndex: number,
  delta: number,
): { year: number; monthIndex: number } {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

/** Calendar cells for a month view (Sunday-first), including leading/trailing days. */
export function getMonthMatrix(
  year: number,
  monthIndex: number,
): Array<{ dateKey: string; day: number; inMonth: boolean }> {
  const first = new Date(year, monthIndex, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrev = new Date(year, monthIndex, 0).getDate();

  const cells: Array<{ dateKey: string; day: number; inMonth: boolean }> = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    const day = daysInPrev - i;
    const date = new Date(year, monthIndex - 1, day);
    cells.push({
      dateKey: formatLocalDate(date),
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({
      dateKey: formatLocalDate(date),
      day,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const day = cells.length - (startOffset + daysInMonth) + 1;
    const date = new Date(year, monthIndex + 1, day);
    cells.push({
      dateKey: formatLocalDate(date),
      day: date.getDate(),
      inMonth: false,
    });
  }

  return cells;
}
