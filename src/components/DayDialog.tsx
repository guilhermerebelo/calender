import { Edit3, X } from "lucide-react";
import { dayHours } from "../constants";
import { fullDateLabel } from "../dateUtils";
import { eyebrowClass, iconButtonClass, miniButtonClass } from "../uiClasses";
import { TravelEvent } from "../types";

type DayDialogProps = {
  date: string;
  events: TravelEvent[];
  onClose: () => void;
  onCreateEvent: (date: string, startTime?: string) => void;
  onEditEvent: (event: TravelEvent) => void;
};

export function DayDialog({ date, events, onClose, onCreateEvent, onEditEvent }: DayDialogProps) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={onClose}>
      <section
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <span className={eyebrowClass}>Visao do dia</span>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-white">{fullDateLabel(date)}</h2>
          </div>
          <button className={iconButtonClass} type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-auto">
          {dayHours.map((hour) => {
            const hourEvents = events.filter((event) => event.startTime.startsWith(hour.slice(0, 2)));
            return (
              <div className="grid border-b border-slate-800 sm:grid-cols-[78px_minmax(0,1fr)]" key={hour}>
                <button
                  className="min-h-9 border-b border-slate-800 bg-slate-900 font-mono text-sm font-black text-slate-400 hover:bg-cyan-950 hover:text-cyan-100 sm:border-b-0 sm:border-r"
                  type="button"
                  onClick={() => onCreateEvent(date, hour)}
                >
                  {hour}
                </button>
                <div className="flex min-h-[52px] flex-col justify-center gap-2 px-2.5 py-2">
                  {hourEvents.length === 0 && <span className="text-sm text-slate-500">Livre</span>}
                  {hourEvents.map((event) => (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2.5 shadow-sm shadow-black/20" key={event.id}>
                      <div>
                        <strong>{event.title}</strong>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {event.startTime} ate {event.endTime}
                        </span>
                        {event.comments && <p className="mt-1 text-sm text-slate-400">{event.comments}</p>}
                      </div>
                      <button className={miniButtonClass} type="button" onClick={() => onEditEvent(event)} aria-label="Editar evento">
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
  );
}
