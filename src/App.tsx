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
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

function nextHour(time: string) {
  const [hour = "9", minute = "0"] = time.split(":");
  const value = Math.min(Number(hour) + 1, 23);
  return `${String(value).padStart(2, "0")}:${minute.padStart(2, "0")}`;
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
    const handleKey = (event: KeyboardEvent) => {
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
    setContextMenu({ x: event.clientX, y: event.clientY, date });
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
    <main className="app-shell">
      <section className="calendar-panel" aria-label="calender">
        <header className="topbar">
          <div>
            <span className="eyebrow">calender</span>
            <h1>{monthLabel(visibleMonth)}</h1>
          </div>
          <div className="month-actions">
            <button className="icon-button" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Mes anterior">
              <ChevronLeft size={18} />
            </button>
            <button className="today-button" type="button" onClick={() => setVisibleMonth(new Date())}>
              Hoje
            </button>
            <button className="icon-button" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Proximo mes">
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="week-row">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {monthDays.map((day) => {
            const dayEvents = eventsByDate[day.key] ?? [];
            const expanded = expandedDays.has(day.key);
            const painted = paintForDay(day.key);
            return (
              <div
                className={`day-cell ${day.inCurrentMonth ? "" : "muted"} ${day.isToday ? "today" : ""} ${painted ? "painted" : ""}`}
                key={day.key}
                onClick={() => setDayViewDate(day.key)}
                onContextMenu={(event) => handleDayContextMenu(event, day.key)}
                role="button"
                style={painted ? ({ "--paint-color": painted.color } as CSSProperties) : undefined}
                tabIndex={0}
              >
                <div className="day-cell-top">
                  <span className="day-number">{day.date.getDate()}</span>
                  <div className="day-tools">
                    {painted && <span className="paint-dot" title={painted.colorName} />}
                    {dayEvents.length > 0 && (
                      <button className="collapse-button" type="button" onClick={(event) => toggleDayExpansion(event, day.key)} aria-label="Mostrar eventos">
                        <span>{dayEvents.length}</span>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                {expanded && (
                  <div className="event-chips">
                    {dayEvents.map((event) => (
                      <span className="event-chip" key={event.id}>
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

      <aside className="sidebar" aria-label="Eventos cadastrados">
        <div className="sidebar-header">
          <div>
            <span className="eyebrow">Roteiro</span>
            <h2>Eventos</h2>
          </div>
          <button className="icon-button" type="button" onClick={() => openCreateEvent(toDateKey(new Date()))} aria-label="Adicionar evento">
            <Plus size={18} />
          </button>
        </div>

        <div className="event-list compact-scroll">
          {sortedEvents.length === 0 && (
            <div className="empty-state">
              <CalendarDays size={30} />
              <p>Nenhum evento cadastrado.</p>
              <span>Use o botao direito em um dia para adicionar o primeiro item.</span>
            </div>
          )}

          {sortedEvents.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-card-main">
                <div>
                  <strong>{event.title}</strong>
                  <span className="event-date">
                    <CalendarDays size={14} /> {fullDateLabel(event.date)}
                  </span>
                  <span className="event-date">
                    <Clock size={14} /> {event.startTime} ate {event.endTime}
                  </span>
                </div>
                <div className="event-actions">
                  <button className="mini-button" type="button" onClick={() => openEditEvent(event)} aria-label="Editar evento">
                    <Edit3 size={14} />
                  </button>
                  <button className="mini-button danger" type="button" onClick={() => setEvents((current) => current.filter((item) => item.id !== event.id))} aria-label="Excluir evento">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {event.comments && (
                <p className="event-comments">
                  <MessageSquare size={14} /> {event.comments}
                </p>
              )}
            </article>
          ))}
        </div>

        <div className="paint-section">
          <div className="sidebar-header secondary">
            <div>
              <span className="eyebrow">calender pintado</span>
              <h2>Dias</h2>
            </div>
            <Layers size={18} />
          </div>
          <div className="paint-list compact-scroll">
            {sortedPaints.length === 0 && <p className="subtle-text">Nenhum periodo pintado.</p>}
            {sortedPaints.map((period) => (
              <article className="paint-card" key={period.id}>
                <span className="paint-swatch" style={{ backgroundColor: period.color }} />
                <div>
                  <strong>{period.colorName}</strong>
                  <span>{fullDateLabel(period.startDate)}</span>
                  {period.startDate !== period.endDate && <span>{fullDateLabel(period.endDate)}</span>}
                </div>
                <button className="mini-button danger" type="button" onClick={() => setPaintedPeriods((current) => current.filter((item) => item.id !== period.id))} aria-label="Remover pintura">
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </aside>

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => openCreateEvent(contextMenu.date)}>
            <Plus size={16} />
            Adicionar evento
          </button>
          <button type="button" onClick={() => openPaintCalendar(contextMenu.date)}>
            <Paintbrush size={16} />
            Pintar calender
          </button>
        </div>
      )}

      {dayViewDate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDayViewDate(null)}>
          <section className="modal day-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Visao do dia</span>
                <h2>{fullDateLabel(dayViewDate)}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDayViewDate(null)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <div className="day-timeline compact-scroll">
              {dayHours.map((hour) => {
                const hourEvents = selectedDayEvents.filter((event) => event.startTime.startsWith(hour.slice(0, 2)));
                return (
                  <div className="time-row" key={hour}>
                    <button className="time-label" type="button" onClick={() => openCreateEvent(dayViewDate, hour)}>
                      {hour}
                    </button>
                    <div className="time-content">
                      {hourEvents.length === 0 && <span className="time-placeholder">Livre</span>}
                      {hourEvents.map((event) => (
                        <div className="time-event" key={event.id}>
                          <div>
                            <strong>{event.title}</strong>
                            <span>{event.startTime} ate {event.endTime}</span>
                            {event.comments && <p>{event.comments}</p>}
                          </div>
                          <button className="mini-button" type="button" onClick={() => openEditEvent(event)} aria-label="Editar evento">
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
        <div className="modal-backdrop" role="presentation" onMouseDown={closeEventForm}>
          <section className="modal form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{editingEvent ? "Editar" : "Novo"} evento</span>
                <h2>{fullDateLabel(draft.date)}</h2>
              </div>
              <button className="icon-button" type="button" onClick={closeEventForm} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form className="event-form" onSubmit={submitEvent}>
              <label>
                Titulo
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} autoFocus required />
              </label>
              <div className="form-grid three">
                <label>
                  Data
                  <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required />
                </label>
                <label>
                  Inicio
                  <input type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} required />
                </label>
                <label>
                  Fim
                  <input type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} required />
                </label>
              </div>
              <label>
                Comentarios
                <textarea value={draft.comments} onChange={(event) => setDraft({ ...draft, comments: event.target.value })} rows={5} />
              </label>
              <div className="form-footer">
                <span>
                  <MapPin size={15} />
                  Planeje horarios, deslocamentos e reservas.
                </span>
                <button className="primary-button" type="submit">
                  Salvar evento
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {paintDraft && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closePaintForm}>
          <section className="modal form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Pintar calender</span>
                <h2>Periodo</h2>
              </div>
              <button className="icon-button" type="button" onClick={closePaintForm} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <form className="event-form" onSubmit={submitPaint}>
              <div className="form-grid">
                <label>
                  Inicio
                  <input type="date" value={paintDraft.startDate} onChange={(event) => setPaintDraft({ ...paintDraft, startDate: event.target.value })} required />
                </label>
                <label>
                  Fim
                  <input type="date" value={paintDraft.endDate} onChange={(event) => setPaintDraft({ ...paintDraft, endDate: event.target.value })} required />
                </label>
              </div>

              <div className="color-field">
                <span>Cor</span>
                <button className="color-trigger" type="button" onClick={() => setColorPopoverOpen((open) => !open)}>
                  <span className="paint-swatch" style={{ backgroundColor: paintDraft.color }} />
                  {paintDraft.colorName}
                  <Palette size={16} />
                </button>
                {colorPopoverOpen && (
                  <div className="color-popover">
                    {paintColors.map((color) => (
                      <button
                        className={`color-option ${paintDraft.color === color.value ? "selected" : ""}`}
                        key={color.id}
                        type="button"
                        onClick={() => {
                          setPaintDraft({ ...paintDraft, color: color.value, colorName: color.name });
                          setColorPopoverOpen(false);
                        }}
                      >
                        <span style={{ backgroundColor: color.value }} />
                        {color.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {paintError && <p className="form-error">{paintError}</p>}

              <div className="form-footer">
                <span>
                  <Paintbrush size={15} />
                  Periodos pintados nao podem sobrescrever outros dias pintados.
                </span>
                <button className="primary-button" type="submit">
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
