import { PaintedPeriod, TravelEvent } from "./types";
import { nextHour } from "./timeUtils";

const RIGHT_PANEL_OPEN_STORAGE_KEY = "calender:painel-direito-aberto";

export type TravelDatabase = {
  events: TravelEvent[];
  paintedPeriods: PaintedPeriod[];
};

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeEvents(value: unknown): TravelEvent[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((event): TravelEvent[] => {
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
}

function normalizePaintedPeriods(value: unknown): PaintedPeriod[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((period): PaintedPeriod[] => {
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
}

export async function loadDatabase(): Promise<TravelDatabase> {
  const response = await fetch("/api/database", { cache: "no-store" });
  if (!response.ok) throw new Error("Nao foi possivel carregar o banco local.");

  const parsed = await response.json();
  return {
    events: normalizeEvents(parsed.events),
    paintedPeriods: normalizePaintedPeriods(parsed.paintedPeriods),
  };
}

export async function saveDatabase(database: TravelDatabase): Promise<void> {
  const response = await fetch("/api/database", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(database),
  });

  if (!response.ok) throw new Error("Nao foi possivel salvar o banco local.");
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
