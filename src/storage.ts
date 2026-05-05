import { PaintedPeriod, TravelEvent } from "./types";
import { nextHour } from "./timeUtils";

const EVENTS_STORAGE_KEY = "calender:eventos";
const PAINT_STORAGE_KEY = "calender:pinturas";
const RIGHT_PANEL_OPEN_STORAGE_KEY = "calender:painel-direito-aberto";

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
      if (!event || typeof event !== "object" || !isString(event.title)) return [];

      const rawStartDate = event.startDate ?? event.date;
      const rawEndDate = event.endDate ?? event.date ?? rawStartDate;
      if (!isDateKey(rawStartDate) || !isDateKey(rawEndDate)) return [];

      const startTime = event.startTime ?? event.time ?? "09:00";
      const normalizedStartTime = isTime(startTime) ? startTime : "09:00";
      const normalizedEndTime = isTime(event.endTime) ? event.endTime : nextHour(normalizedStartTime);
      const startDate = rawStartDate <= rawEndDate ? rawStartDate : rawEndDate;
      const endDate = rawStartDate <= rawEndDate ? rawEndDate : rawStartDate;

      return [{
        id: isString(event.id) && event.id ? event.id : crypto.randomUUID(),
        startDate,
        endDate,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime > normalizedStartTime ? normalizedEndTime : nextHour(normalizedStartTime),
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

export function loadRightPanelOpen(): boolean {
  try {
    return localStorage.getItem(RIGHT_PANEL_OPEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveRightPanelOpen(open: boolean) {
  localStorage.setItem(RIGHT_PANEL_OPEN_STORAGE_KEY, String(open));
}
