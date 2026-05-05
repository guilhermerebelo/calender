import { type FormEvent, type MouseEvent, useEffect, useMemo, useState } from "react";
import { CalendarPanel } from "./components/CalendarPanel";
import { ContextMenu } from "./components/ContextMenu";
import { DayDialog } from "./components/DayDialog";
import { EventDialog } from "./components/EventDialog";
import { EventsPanel } from "./components/EventsPanel";
import { PaintDialog } from "./components/PaintDialog";
import { defaultColor } from "./constants";
import { eachDateKeyInRange, fullDateLabel } from "./dateUtils";
import {
  loadEvents,
  loadExpandedDays,
  loadPaintedPeriods,
  loadRightPanelOpen,
  saveEvents,
  saveExpandedDays,
  savePaintedPeriods,
  saveRightPanelOpen,
} from "./storage";
import { nextHour } from "./timeUtils";
import { EventDraft, PaintedPeriod, PaintDraft, TravelEvent } from "./types";

const emptyDraft = (date: string, startTime = "09:00"): EventDraft => ({
  title: "",
  date,
  startTime,
  endTime: nextHour(startTime),
  comments: "",
});

export function App() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<TravelEvent[]>(() => loadEvents());
  const [paintedPeriods, setPaintedPeriods] = useState<PaintedPeriod[]>(() => loadPaintedPeriods());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set(loadExpandedDays()));
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);
  const [dayViewDate, setDayViewDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TravelEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [paintDraft, setPaintDraft] = useState<PaintDraft | null>(null);
  const [paintError, setPaintError] = useState("");
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(() => loadRightPanelOpen());

  useEffect(() => saveEvents(events), [events]);
  useEffect(() => savePaintedPeriods(paintedPeriods), [paintedPeriods]);
  useEffect(() => saveExpandedDays([...expandedDays]), [expandedDays]);
  useEffect(() => saveRightPanelOpen(rightPanelOpen), [rightPanelOpen]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeDialogs();
      setContextMenu(null);
    };

    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)),
    [events]
  );

  const sortedPaints = useMemo(
    () => [...paintedPeriods].sort((a, b) => `${a.startDate} ${a.endDate}`.localeCompare(`${b.startDate} ${b.endDate}`)),
    [paintedPeriods]
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, TravelEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event].sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {});
  }, [events]);

  const selectedDayEvents = dayViewDate ? eventsByDate[dayViewDate] ?? [] : [];

  function closeDialogs() {
    setDraft(null);
    setPaintDraft(null);
    setDayViewDate(null);
    setEditingEvent(null);
    setColorPopoverOpen(false);
    setPaintError("");
  }

  function openCreateEvent(date: string, startTime = "09:00") {
    setEditingEvent(null);
    setDraft(emptyDraft(date, startTime));
    setContextMenu(null);
  }

  function openEditEvent(event: TravelEvent) {
    setEditingEvent(event);
    setDraft({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      comments: event.comments,
    });
  }

  function openPaintCalendar(date: string) {
    setPaintDraft({
      startDate: date,
      endDate: date,
      color: defaultColor.value,
      colorName: defaultColor.name,
    });
    setPaintError("");
    setContextMenu(null);
  }

  function submitEvent(event: FormEvent) {
    event.preventDefault();
    if (!draft || !draft.title.trim()) return;

    const now = new Date().toISOString();
    const normalizedDraft = {
      ...draft,
      title: draft.title.trim(),
      comments: draft.comments.trim(),
      endTime: draft.endTime <= draft.startTime ? nextHour(draft.startTime) : draft.endTime,
    };

    if (editingEvent) {
      setEvents((current) =>
        current.map((item) => (item.id === editingEvent.id ? { ...item, ...normalizedDraft, updatedAt: now } : item))
      );
    } else {
      setEvents((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          ...normalizedDraft,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    setDraft(null);
    setEditingEvent(null);
  }

  function submitPaint(event: FormEvent) {
    event.preventDefault();
    if (!paintDraft) return;

    const startDate = paintDraft.startDate <= paintDraft.endDate ? paintDraft.startDate : paintDraft.endDate;
    const endDate = paintDraft.startDate <= paintDraft.endDate ? paintDraft.endDate : paintDraft.startDate;
    const selectedDays = eachDateKeyInRange(startDate, endDate);
    const paintedDays = new Set(paintedPeriods.flatMap((period) => eachDateKeyInRange(period.startDate, period.endDate)));
    const blockedDay = selectedDays.find((day) => paintedDays.has(day));

    if (blockedDay) {
      setPaintError(`O dia ${fullDateLabel(blockedDay)} ja esta pintado.`);
      return;
    }

    setPaintedPeriods((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        startDate,
        endDate,
        color: paintDraft.color,
        colorName: paintDraft.colorName,
        createdAt: new Date().toISOString(),
      },
    ]);
    setPaintDraft(null);
    setColorPopoverOpen(false);
  }

  function handleDayContextMenu(event: MouseEvent<HTMLDivElement>, date: string) {
    event.preventDefault();
    const menuWidth = 220;
    const menuHeight = 96;
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - menuWidth - 8),
      y: Math.min(event.clientY, window.innerHeight - menuHeight - 8),
      date,
    });
  }

  function toggleDayExpansion(event: MouseEvent<HTMLButtonElement>, date: string) {
    event.stopPropagation();
    setExpandedDays((current) => {
      const next = new Set(current);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-slate-950 font-sans text-slate-100 lg:h-screen lg:overflow-hidden">
      <div className={`grid min-h-screen gap-4 p-3 lg:h-screen lg:p-4 ${rightPanelOpen ? "lg:grid-cols-[minmax(0,1fr)_370px]" : "lg:grid-cols-1"}`}>
        <CalendarPanel
          visibleMonth={visibleMonth}
          eventsByDate={eventsByDate}
          expandedDays={expandedDays}
          paintedPeriods={paintedPeriods}
          rightPanelOpen={rightPanelOpen}
          onVisibleMonthChange={setVisibleMonth}
          onRightPanelToggle={() => setRightPanelOpen((open) => !open)}
          onDayOpen={setDayViewDate}
          onDayContextMenu={handleDayContextMenu}
          onDayExpansionToggle={toggleDayExpansion}
        />

        {rightPanelOpen && (
          <EventsPanel
            events={sortedEvents}
            paintedPeriods={sortedPaints}
            onCreateEvent={openCreateEvent}
            onEditEvent={openEditEvent}
            onDeleteEvent={(eventId) => setEvents((current) => current.filter((item) => item.id !== eventId))}
            onDeletePaintedPeriod={(periodId) => setPaintedPeriods((current) => current.filter((item) => item.id !== periodId))}
            onClose={() => setRightPanelOpen(false)}
          />
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAddEvent={() => openCreateEvent(contextMenu.date)}
          onPaintCalendar={() => openPaintCalendar(contextMenu.date)}
        />
      )}

      {dayViewDate && (
        <DayDialog
          date={dayViewDate}
          events={selectedDayEvents}
          onClose={() => setDayViewDate(null)}
          onCreateEvent={openCreateEvent}
          onEditEvent={openEditEvent}
        />
      )}

      {draft && (
        <EventDialog
          draft={draft}
          editing={Boolean(editingEvent)}
          onClose={() => {
            setDraft(null);
            setEditingEvent(null);
          }}
          onSubmit={submitEvent}
          onDraftChange={setDraft}
        />
      )}

      {paintDraft && (
        <PaintDialog
          draft={paintDraft}
          error={paintError}
          colorPopoverOpen={colorPopoverOpen}
          onClose={() => {
            setPaintDraft(null);
            setPaintError("");
            setColorPopoverOpen(false);
          }}
          onSubmit={submitPaint}
          onDraftChange={setPaintDraft}
          onColorPopoverToggle={() => setColorPopoverOpen((open) => !open)}
          onColorPopoverClose={() => setColorPopoverOpen(false)}
        />
      )}
    </main>
  );
}
