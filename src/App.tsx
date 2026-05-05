import { CalendarDays, ChevronLeft, ChevronRight, Clock, Edit3, MapPin, MessageSquare, Plus, Trash2, X } from "lucide-react";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { addMonths, buildMonthGrid, fullDateLabel, monthLabel, toDateKey } from "./dateUtils";
import { loadEvents, saveEvents } from "./storage";
import { EventDraft, TravelEvent } from "./types";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const dayHours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

const emptyDraft = (date: string, time = "09:00"): EventDraft => ({
  title: "",
  date,
  time,
  comments: "",
});

export function App() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [events, setEvents] = useState<TravelEvent[]>(() => loadEvents());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; date: string } | null>(null);
  const [dayViewDate, setDayViewDate] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<TravelEvent | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("keydown", closeMenu);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("keydown", closeMenu);
    };
  }, []);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [events]
  );

  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, TravelEvent[]>>((acc, event) => {
      acc[event.date] = [...(acc[event.date] ?? []), event].sort((a, b) => a.time.localeCompare(b.time));
      return acc;
    }, {});
  }, [events]);

  const monthDays = buildMonthGrid(visibleMonth);
  const selectedDayEvents = dayViewDate ? eventsByDate[dayViewDate] ?? [] : [];

  function openCreateEvent(date: string, time = "09:00") {
    setEditingEvent(null);
    setDraft(emptyDraft(date, time));
    setContextMenu(null);
  }

  function openEditEvent(event: TravelEvent) {
    setEditingEvent(event);
    setDraft({
      title: event.title,
      date: event.date,
      time: event.time,
      comments: event.comments,
    });
  }

  function submitEvent(event: FormEvent) {
    event.preventDefault();
    if (!draft || !draft.title.trim()) return;

    const now = new Date().toISOString();
    if (editingEvent) {
      setEvents((current) =>
        current.map((item) =>
          item.id === editingEvent.id
            ? { ...item, ...draft, title: draft.title.trim(), comments: draft.comments.trim(), updatedAt: now }
            : item
        )
      );
    } else {
      setEvents((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          ...draft,
          title: draft.title.trim(),
          comments: draft.comments.trim(),
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }

    setDraft(null);
    setEditingEvent(null);
  }

  function removeEvent(eventId: string) {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  }

  function handleDayContextMenu(event: MouseEvent<HTMLButtonElement>, date: string) {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, date });
  }

  return (
    <main className="app-shell">
      <section className="calendar-panel" aria-label="Calendario de viagem">
        <header className="topbar">
          <div>
            <span className="eyebrow">Planejamento de viagem</span>
            <h1>{monthLabel(visibleMonth)}</h1>
          </div>
          <div className="month-actions">
            <button className="icon-button" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))} aria-label="Mes anterior">
              <ChevronLeft size={20} />
            </button>
            <button className="today-button" type="button" onClick={() => setVisibleMonth(new Date())}>
              Hoje
            </button>
            <button className="icon-button" type="button" onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))} aria-label="Proximo mes">
              <ChevronRight size={20} />
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
            return (
              <button
                className={`day-cell ${day.inCurrentMonth ? "" : "muted"} ${day.isToday ? "today" : ""}`}
                key={day.key}
                type="button"
                onClick={() => setDayViewDate(day.key)}
                onContextMenu={(event) => handleDayContextMenu(event, day.key)}
              >
                <span className="day-number">{day.date.getDate()}</span>
                <div className="event-chips">
                  {dayEvents.slice(0, 3).map((event) => (
                    <span className="event-chip" key={event.id}>
                      {event.time} {event.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && <span className="more-chip">+{dayEvents.length - 3}</span>}
                </div>
              </button>
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
            <Plus size={19} />
          </button>
        </div>

        <div className="event-list">
          {sortedEvents.length === 0 && (
            <div className="empty-state">
              <CalendarDays size={34} />
              <p>Nenhum evento cadastrado.</p>
              <span>Use o botao direito em um dia para adicionar o primeiro item da viagem.</span>
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
                    <Clock size={14} /> {event.time}
                  </span>
                </div>
                <div className="event-actions">
                  <button className="mini-button" type="button" onClick={() => openEditEvent(event)} aria-label="Editar evento">
                    <Edit3 size={15} />
                  </button>
                  <button className="mini-button danger" type="button" onClick={() => removeEvent(event.id)} aria-label="Excluir evento">
                    <Trash2 size={15} />
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
      </aside>

      {contextMenu && (
        <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => openCreateEvent(contextMenu.date)}>
            <Plus size={16} />
            Adicionar evento
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
                <X size={20} />
              </button>
            </div>

            <div className="day-timeline">
              {dayHours.map((hour) => {
                const hourEvents = selectedDayEvents.filter((event) => event.time.startsWith(hour.slice(0, 2)));
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
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setDraft(null)}>
          <section className="modal form-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{editingEvent ? "Editar" : "Novo"} evento</span>
                <h2>{fullDateLabel(draft.date)}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setDraft(null)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form className="event-form" onSubmit={submitEvent}>
              <label>
                Titulo
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} autoFocus required />
              </label>
              <div className="form-grid">
                <label>
                  Data
                  <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required />
                </label>
                <label>
                  Hora
                  <input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} required />
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
    </main>
  );
}
