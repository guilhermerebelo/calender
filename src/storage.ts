import { PaintedPeriod, TravelEvent } from "./types";

const EVENTS_STORAGE_KEY = "calender:eventos";
const PAINT_STORAGE_KEY = "calender:pinturas";
const EXPANDED_DAYS_STORAGE_KEY = "calender:dias-expandidos";

function addOneHour(time: string) {
  const [hour = "9", minute = "0"] = time.split(":");
  const numericHour = Number(hour);

  if (!Number.isFinite(numericHour)) return "10:00";
  if (numericHour >= 23) return "23:59";

  return `${String(numericHour + 1).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function loadEvents(): TravelEvent[] {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((event): TravelEvent[] => {
      if (!event || typeof event !== "object" || !isDateKey(event.date) || !isString(event.title)) return [];

      const startTime = event.startTime ?? event.time ?? "09:00";
      const normalizedStartTime = isTime(startTime) ? startTime : "09:00";
      const normalizedEndTime = isTime(event.endTime) ? event.endTime : addOneHour(normalizedStartTime);

      return [{
        id: isString(event.id) && event.id ? event.id : crypto.randomUUID(),
        date: event.date,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime > normalizedStartTime ? normalizedEndTime : addOneHour(normalizedStartTime),
        title: event.title,
        comments: isString(event.comments) ? event.comments : "",
        createdAt: isString(event.createdAt) ? event.createdAt : new Date().toISOString(),
        updatedAt: isString(event.updatedAt) ? event.updatedAt : new Date().toISOString(),
      }];
    });
  } catch {
    return [];
  }
}

export function saveEvents(events: TravelEvent[]) {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function loadPaintedPeriods(): PaintedPeriod[] {
  try {
    const stored = localStorage.getItem(PAINT_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((period): PaintedPeriod[] => {
      if (
        !period ||
        typeof period !== "object" ||
        !isString(period.id) ||
        !isDateKey(period.startDate) ||
        !isDateKey(period.endDate) ||
        !isString(period.color) ||
        !isString(period.colorName)
      ) {
        return [];
      }

      return [{
        id: period.id,
        startDate: period.startDate <= period.endDate ? period.startDate : period.endDate,
        endDate: period.startDate <= period.endDate ? period.endDate : period.startDate,
        color: period.color,
        colorName: period.colorName,
        createdAt: isString(period.createdAt) ? period.createdAt : new Date().toISOString(),
      }];
    });
  } catch {
    return [];
  }
}

export function savePaintedPeriods(periods: PaintedPeriod[]) {
  localStorage.setItem(PAINT_STORAGE_KEY, JSON.stringify(periods));
}

export function loadExpandedDays(): string[] {
  try {
    const stored = localStorage.getItem(EXPANDED_DAYS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isDateKey) : [];
  } catch {
    return [];
  }
}

export function saveExpandedDays(days: string[]) {
  localStorage.setItem(EXPANDED_DAYS_STORAGE_KEY, JSON.stringify(days));
}
