import { CalendarDays, ChevronDown, ChevronRight, Clock, Edit3, Layers, MessageSquare, Palette, PanelRightClose, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { fullDateLabel, toDateKey } from "../dateUtils";
import { eyebrowClass, iconButtonClass, metaClass, miniButtonClass, panelClass } from "../uiClasses";
import { PaintedPeriod, TravelEvent } from "../types";

type EventsPanelProps = {
  events: TravelEvent[];
  paintedPeriods: PaintedPeriod[];
  onCreateEvent: (date: string) => void;
  onEditEvent: (event: TravelEvent) => void;
  onEditPaintedPeriod: (period: PaintedPeriod) => void;
  onDeleteEvent: (eventId: string) => void;
  onDeletePaintedPeriod: (periodId: string) => void;
  onClose: () => void;
};

export function EventsPanel({
  events,
  paintedPeriods,
  onCreateEvent,
  onEditEvent,
  onEditPaintedPeriod,
  onDeleteEvent,
  onDeletePaintedPeriod,
  onClose,
}: EventsPanelProps) {
  const [eventsOpen, setEventsOpen] = useState(true);
  const [paintedOpen, setPaintedOpen] = useState(true);

  function eventDateLabel(event: TravelEvent) {
    return event.startDate === event.endDate
      ? fullDateLabel(event.startDate)
      : `${fullDateLabel(event.startDate)} - ${fullDateLabel(event.endDate)}`;
  }

  return (
    <aside className={`${panelClass} flex min-h-[420px] flex-col gap-2 p-3.5`} aria-label="Eventos cadastrados">
      <section className={`flex min-h-0 flex-col ${eventsOpen ? "flex-1" : "shrink-0"}`}>
        <div className="flex items-center justify-between gap-3">
          <button className="min-w-0 text-left" type="button" onClick={() => setEventsOpen((open) => !open)} aria-expanded={eventsOpen}>
            <span className={`${eyebrowClass} inline-flex items-center gap-1.5`}>
              {eventsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Clock size={14} />
              Eventos
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button className={iconButtonClass} type="button" onClick={() => onCreateEvent(toDateKey(new Date()))} aria-label="Adicionar evento">
              <Plus size={18} />
            </button>
            <button className={iconButtonClass} type="button" onClick={onClose} aria-label="Fechar painel direito">
              <PanelRightClose size={18} />
            </button>
          </div>
        </div>

        {eventsOpen && (
          <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-auto pr-1">
            {events.length === 0 && (
              <div className="grid min-h-48 place-items-center content-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-900 p-5 text-center text-slate-400">
                <CalendarDays size={30} />
                <p className="m-0 font-extrabold text-white">Nenhum evento cadastrado.</p>
                <span className="max-w-64 text-sm">Use o botao direito em um dia para adicionar o primeiro item.</span>
              </div>
            )}

            {events.map((event) => (
              <article className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm shadow-black/20" key={event.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="mb-2 block">{event.title}</strong>
                    <span className={metaClass}>
                      <CalendarDays size={14} /> {eventDateLabel(event)}
                    </span>
                    <span className={`${metaClass} mt-1`}>
                      <Clock size={14} /> {event.startTime} ate {event.endTime}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button className={miniButtonClass} type="button" onClick={() => onEditEvent(event)} aria-label="Editar evento">
                      <Edit3 size={14} />
                    </button>
                    <button
                      className={`${miniButtonClass} hover:border-red-400 hover:bg-red-950 hover:text-red-200`}
                      type="button"
                      onClick={() => onDeleteEvent(event.id)}
                      aria-label="Excluir evento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {event.comments && (
                  <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                    <MessageSquare className="mt-0.5 shrink-0" size={14} /> {event.comments}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={`flex min-h-0 flex-col border-t border-slate-800 pt-2 ${paintedOpen ? "max-h-[42vh] min-h-48" : "shrink-0"}`}>
        <div className="flex items-end justify-between gap-3">
          <button className="min-w-0 text-left" type="button" onClick={() => setPaintedOpen((open) => !open)} aria-expanded={paintedOpen}>
            <span className={`${eyebrowClass} inline-flex items-center gap-1.5`}>
              {paintedOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Palette size={14} />
              Cores calendario
            </span>
          </button>
          <Layers className="shrink-0 text-slate-300" size={18} />
        </div>

        {paintedOpen && (
          <div className="mt-2.5 flex flex-col gap-2 overflow-auto pr-1">
            {paintedPeriods.length === 0 && <p className="text-xs text-slate-400">Nenhum periodo pintado.</p>}
            {paintedPeriods.map((period) => (
              <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm shadow-black/20" key={period.id}>
                <span className="h-[18px] w-[18px] rounded border border-slate-600" style={{ backgroundColor: period.color }} />
                <div>
                  <strong className="mb-1.5 block">{period.colorName}</strong>
                  <span className="block text-xs text-slate-400">{fullDateLabel(period.startDate)}</span>
                  {period.startDate !== period.endDate && <span className="block text-xs text-slate-400">{fullDateLabel(period.endDate)}</span>}
                </div>
                <div className="flex gap-1.5">
                  <button className={miniButtonClass} type="button" onClick={() => onEditPaintedPeriod(period)} aria-label="Editar pintura">
                    <Edit3 size={14} />
                  </button>
                  <button
                    className={`${miniButtonClass} hover:border-red-400 hover:bg-red-950 hover:text-red-200`}
                    type="button"
                    onClick={() => onDeletePaintedPeriod(period.id)}
                    aria-label="Remover pintura"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
