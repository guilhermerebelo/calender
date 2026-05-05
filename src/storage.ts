import { PaintedPeriod, TravelEvent } from "./types";

const EVENTS_STORAGE_KEY = "calender:eventos";
const PAINT_STORAGE_KEY = "calender:pinturas";
const COLLAPSE_STORAGE_KEY = "calender:dias-expandidos";

function addOneHour(time: string) {
  const [hour = "9", minute = "0"] = time.split(":");
  const nextHour = Math.min(Number(hour) + 1, 23);
  return `${String(nextHour).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function loadEvents(): TravelEvent[] {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((event) => {
      const startTime = event.startTime ?? event.time ?? "09:00";
      return {
        id: event.id,
        date: event.date,
        startTime,
        endTime: event.endTime ?? addOneHour(startTime),
        title: event.title ?? "",
        comments: event.comments ?? "",
        createdAt: event.createdAt ?? new Date().toISOString(),
        updatedAt: event.updatedAt ?? new Date().toISOString(),
      };
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePaintedPeriods(periods: PaintedPeriod[]) {
  localStorage.setItem(PAINT_STORAGE_KEY, JSON.stringify(periods));
}

export function loadExpandedDays(): string[] {
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExpandedDays(days: string[]) {
  localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(days));
}
