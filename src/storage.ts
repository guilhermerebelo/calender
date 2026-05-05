import { TravelEvent } from "./types";

const STORAGE_KEY = "calendario-viagem:eventos";

export function loadEvents(): TravelEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEvents(events: TravelEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
