import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  Layers,
  MapPin,
  MessageSquare,
  Paintbrush,
  Palette,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  buildMonthGrid,
  eachDateKeyInRange,
  fullDateLabel,
  isDateKeyInRange,
  monthLabel,
  toDateKey,
} from "./dateUtils";
import {
  loadEvents,
  loadExpandedDays,
  loadPaintedPeriods,
  saveEvents,
  saveExpandedDays,
  savePaintedPeriods,
} from "./storage";
import { EventDraft, PaintColor, PaintedPeriod, PaintDraft, TravelEvent } from "./types";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const dayHours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

const paintColors: PaintColor[] = [
  { id: "sky", name: "Azul", value: "#38bdf8" },
  { id: "green", name: "Verde", value: "#22c55e" },
  { id: "amber", name: "Amarelo", value: "#f59e0b" },
  { id: "rose", name: "Rosa", value: "#fb7185" },
  { id: "violet", name: "Violeta", value: "#8b5cf6" },
  { id: "cyan", name: "Ciano", value: "#06b6d4" },
  { id: "lime", name: "Lima", value: "#84cc16" },
  { id: "red", name: "Vermelho", value: "#ef4444" },
];

const defaultColor = paintColors[0];

const panelClass = "min-w-0 rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/10";
const iconButtonClass =
  "grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800";
const miniButtonClass =
  "grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800";
const eyebrowClass = "block text-[0.68rem] font-extrabold uppercase tracking-normal text-teal-700";
const metaClass = "flex items-center gap-2 text-xs text-slate-500";
const inputClass =
  "w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function nextHour(time: string) {
  const [hour = "9", minute = "0"] = time.split(":");
  const numericHour = Number(hour);

  if (!Number.isFinite(numericHour)) return "10:00";
  if (numericHour >= 23) return "23:59";

  return `${String(numericHour + 1).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

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

  useEffect(() => saveEvents(events), [events]);
  useEffect(() => savePaintedPeriods(paintedPeriods), [paintedPeriods]);
  useEffect(() => saveExpandedDays([...expandedDays]), [expandedDays]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDraft(null);
      setPaintDraft(null);
      setDayViewDate(null);
      setContextMenu(null);
      setEditingEvent(null);
      setColorPopoverOpen(false);
      setPaintError("");
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

  const monthDays = buildMonthGrid(visibleMonth);
  const selectedDayEvents = dayViewDate ? eventsByDate[dayViewDate] ?? [] : [];

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

  function closeEventForm() {
    setDraft(null);
    setEditingEvent(null);
  }

  function closePaintForm() {
    setPaintDraft(null);
    setPaintError("");
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

  function handleDayKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, date: string) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    setDayViewDate(date);
  }

  function toggleDayExpansion(event: MouseEvent<HTMLButtonElement>, date: string) {
    event.stopPropagation();
    setExpandedDays((current) => {
      const next = new Set(current);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }

  function paintForDay(date: string) {
    return paintedPeriods.find((period) => isDateKeyInRange(date, period.startDate, period.endDate));
  }

  return (
    <main className="min-h-screen bg-slate-100 font-sans text-slate-900 lg:h-screen lg:overflow-hidden">
      <div className="grid min-h-screen gap-4 p-3 lg:h-screen lg:grid-cols-[minmax(0,1fr)_370px] lg:p-4">
        <section className={`${panelClass} flex min-h-0 flex-col p-3.5`} aria-label="Calendario">
          <header className="flex min-h-[50px] items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className={eyebrowClass}>Calendario</span>
              <h1 className="mt-1 text-[clamp(1.32rem,1.75vw,1.85rem)] font-extrabold leading-tight text-slate-950">{monthLabel(visibleMonth)}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button className={iconButtonClass} type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Mes anterior">
                <ChevronLeft size={18} />
              </button>
              <button
                className="h-9 rounded-md border border-teal-700 bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:border-teal-800 hover:bg-teal-800"
                type="button"
                onClick={() => setVisibleMonth(new Date())}
              >
                Hoje
              </button>
              <button className={iconButtonClass} type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Proximo mes">
                <ChevronRight size={18} />
              </button>
            </div>
          </header>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <span className="rounded-md bg-slate-200 px-2 py-1.5 text-center text-[0.72rem] font-black text-slate-600" key={day}>
                {day}
              </span>
            ))}
          </div>

          <div className="mt-2 grid min-h-[520px] flex-1 grid-cols-7 grid-rows-6 gap-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2 lg:min-h-0 lg:max-h-[calc(100vh-118px)]">
            {monthDays.map((day) => {
              const dayEvents = eventsByDate[day.key] ?? [];
              const expanded = expandedDays.has(day.key);
              const painted = paintForDay(day.key);
              const paintedStyle = painted
                ? {
                    borderColor: painted.color,
                    backgroundColor: `${painted.color}22`,
                  }
                : undefined;

              return (
                <div
                  className={`min-h-0 cursor-pointer overflow-hidden rounded-lg border p-1.5 text-left outline-none transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md ${
                    day.inCurrentMonth ? "border-slate-200 bg-white text-slate-900" : "border-slate-100 bg-slate-100 text-slate-400"
                  } ${day.isToday ? "ring-2 ring-teal-500/60" : ""}`}
                  key={day.key}
                  onClick={() => setDayViewDate(day.key)}
                  onContextMenu={(event) => handleDayContextMenu(event, day.key)}
                  onKeyDown={(event) => handleDayKeyDown(event, day.key)}
                  role="button"
                  style={paintedStyle}
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 font-mono text-sm font-black">{day.date.getDate()}</span>
                    <div className="flex items-center gap-1">
                      {painted && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: painted.color }} title={painted.colorName} />}
                      {dayEvents.length > 0 && (
                        <button
                          className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[0.72rem] font-black text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                          type="button"
                          onClick={(event) => toggleDayExpansion(event, day.key)}
                          aria-label="Mostrar eventos"
                        >
                          <span>{dayEvents.length}</span>
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-1.5 flex min-w-0 flex-col gap-1">
                      {dayEvents.map((event) => (
                        <span className="block truncate rounded border border-teal-100 bg-teal-50 px-1.5 py-1 text-[0.68rem] text-teal-900" key={event.id}>
                          {event.startTime}-{event.endTime} {event.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className={`${panelClass} flex min-h-[420px] flex-col p-3.5`} aria-label="Eventos cadastrados">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className={eyebrowClass}>Roteiro</span>
              <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">Eventos</h2>
            </div>
            <button className={iconButtonClass} type="button" onClick={() => openCreateEvent(toDateKey(new Date()))} aria-label="Adicionar evento">
              <Plus size={18} />
            </button>
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto pr-1">
            {sortedEvents.length === 0 && (
              <div className="grid min-h-48 place-items-center content-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-slate-500">
                <CalendarDays size={30} />
                <p className="m-0 font-extrabold text-slate-950">Nenhum evento cadastrado.</p>
                <span className="max-w-64 text-sm">Use o botao direito em um dia para adicionar o primeiro item.</span>
              </div>
            )}

            {sortedEvents.map((event) => (
              <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm" key={event.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="mb-2 block">{event.title}</strong>
                    <span className={metaClass}>
                      <CalendarDays size={14} /> {fullDateLabel(event.date)}
                    </span>
                    <span className={`${metaClass} mt-1`}>
                      <Clock size={14} /> {event.startTime} ate {event.endTime}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button className={miniButtonClass} type="button" onClick={() => openEditEvent(event)} aria-label="Editar evento">
                      <Edit3 size={14} />
                    </button>
                    <button
                      className={`${miniButtonClass} hover:border-red-300 hover:bg-red-50 hover:text-red-700`}
                      type="button"
                      onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))}
                      aria-label="Excluir evento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {event.comments && (
                  <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                    <MessageSquare className="mt-0.5 shrink-0" size={14} /> {event.comments}
                  </p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-3 flex max-h-[34vh] min-h-48 flex-col border-t border-slate-200 pt-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className={eyebrowClass}>Calendario pintado</span>
                <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">Dias</h2>
              </div>
              <Layers size={18} />
            </div>
            <div className="mt-2.5 flex flex-col gap-2 overflow-auto pr-1">
              {sortedPaints.length === 0 && <p className="text-xs text-slate-500">Nenhum periodo pintado.</p>}
              {sortedPaints.map((period) => (
                <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3 shadow-sm" key={period.id}>
                  <span className="h-[18px] w-[18px] rounded border border-slate-300" style={{ backgroundColor: period.color }} />
                  <div>
                    <strong className="mb-1.5 block">{period.colorName}</strong>
                    <span className="block text-xs text-slate-500">{fullDateLabel(period.startDate)}</span>
                    {period.startDate !== period.endDate && <span className="block text-xs text-slate-500">{fullDateLabel(period.endDate)}</span>}
                  </div>
                  <button
                    className={`${miniButtonClass} hover:border-red-300 hover:bg-red-50 hover:text-red-700`}
                    type="button"
                    onClick={() => setPaintedPeriods((current) => current.filter((item) => item.id !== period.id))}
                    aria-label="Remover pintura"
                  >
                    <Trash2 size={14} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {contextMenu && (
        <div
          className="fixed z-40 min-w-52 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-800 hover:bg-teal-50 hover:text-teal-800" type="button" onClick={() => openCreateEvent(contextMenu.date)}>
            <Plus size={16} />
            Adicionar evento
          </button>
          <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-800 hover:bg-teal-50 hover:text-teal-800" type="button" onClick={() => openPaintCalendar(contextMenu.date)}>
            <Paintbrush size={16} />
            Pintar calendario
          </button>
        </div>
      )}

      {dayViewDate && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={() => setDayViewDate(null)}>
          <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <span className={eyebrowClass}>Visao do dia</span>
                <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">{fullDateLabel(dayViewDate)}</h2>
              </div>
              <button className={iconButtonClass} type="button" onClick={() => setDayViewDate(null)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-auto">
              {dayHours.map((hour) => {
                const hourEvents = selectedDayEvents.filter((event) => event.startTime.startsWith(hour.slice(0, 2)));
                return (
                  <div className="grid border-b border-slate-100 sm:grid-cols-[78px_minmax(0,1fr)]" key={hour}>
                    <button className="min-h-9 border-b border-slate-100 bg-slate-50 font-mono text-sm font-black text-slate-500 hover:bg-teal-50 hover:text-teal-800 sm:border-b-0 sm:border-r" type="button" onClick={() => openCreateEvent(dayViewDate, hour)}>
                      {hour}
                    </button>
                    <div className="flex min-h-[52px] flex-col justify-center gap-2 px-2.5 py-2">
                      {hourEvents.length === 0 && <span className="text-sm text-slate-400">Livre</span>}
                      {hourEvents.map((event) => (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm" key={event.id}>
                          <div>
                            <strong>{event.title}</strong>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {event.startTime} ate {event.endTime}
                            </span>
                            {event.comments && <p className="mt-1 text-sm text-slate-500">{event.comments}</p>}
                          </div>
                          <button className={miniButtonClass} type="button" onClick={() => openEditEvent(event)} aria-label="Editar evento">
                            <Edit3 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={closeEventForm}>
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <span className={eyebrowClass}>{editingEvent ? "Editar" : "Novo"} evento</span>
                <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">{fullDateLabel(draft.date)}</h2>
              </div>
              <button className={iconButtonClass} type="button" onClick={closeEventForm} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form className="grid gap-4 p-4" onSubmit={submitEvent}>
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                Titulo
                <input className={inputClass} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} autoFocus required />
              </label>
              <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_1fr]">
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  Data
                  <input className={inputClass} type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  Inicio
                  <input className={inputClass} type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} required />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  Fim
                  <input className={inputClass} type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} required />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                Comentarios
                <textarea className={`${inputClass} resize-y`} value={draft.comments} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} rows={5} />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className={metaClass}>
                  <MapPin size={15} />
                  Planeje horarios, deslocamentos e reservas.
                </span>
                <button className="h-9 rounded-md border border-teal-700 bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-teal-800" type="submit">
                  Salvar evento
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {paintDraft && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={closePaintForm}>
          <section className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <span className={eyebrowClass}>Pintar calendario</span>
                <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-950">Periodo</h2>
              </div>
              <button className={iconButtonClass} type="button" onClick={closePaintForm} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form className="grid gap-4 p-4" onSubmit={submitPaint}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  Inicio
                  <input className={inputClass} type="date" value={paintDraft.startDate} onChange={(event) => setPaintDraft({ ...paintDraft, startDate: event.target.value })} required />
                </label>
                <label className="grid gap-2 text-sm font-extrabold text-slate-700">
                  Fim
                  <input className={inputClass} type="date" value={paintDraft.endDate} onChange={(event) => setPaintDraft({ ...paintDraft, endDate: event.target.value })} required />
                </label>
              </div>

              <div className="relative grid gap-2 text-sm font-extrabold text-slate-700">
                <span>Cor</span>
                <button className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 font-extrabold text-slate-800 shadow-sm" type="button" onClick={() => setColorPopoverOpen((open) => !open)}>
                  <span className="h-[18px] w-[18px] rounded border border-slate-300" style={{ backgroundColor: paintDraft.color }} />
                  {paintDraft.colorName}
                  <Palette size={16} />
                </button>
                {colorPopoverOpen && (
                  <div className="absolute left-0 top-full z-50 mt-2 grid w-full max-w-[300px] grid-cols-2 gap-1.5 rounded-lg border border-slate-200 bg-white p-2 shadow-2xl">
                    {paintColors.map((color) => (
                      <button
                        className={`flex items-center gap-2 rounded-md border p-2 text-left text-slate-800 hover:bg-slate-50 ${
                          paintDraft.color === color.value ? "border-teal-500 bg-teal-50" : "border-transparent"
                        }`}
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setPaintDraft({ ...paintDraft, color: color.value, colorName: color.name });
                          setColorPopoverOpen(false);
                        }}
                      >
                        <span className="h-4 w-4 rounded" style={{ backgroundColor: color.value }} />
                        {color.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {paintError && <p className="m-0 rounded-md border border-red-200 bg-red-50 p-2.5 text-sm font-semibold text-red-700">{paintError}</p>}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className={metaClass}>
                  <Paintbrush size={15} />
                  Periodos pintados nao podem sobrescrever outros dias pintados.
                </span>
                <button className="h-9 rounded-md border border-teal-700 bg-teal-700 px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-teal-800" type="submit">
                  Pintar periodo
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
