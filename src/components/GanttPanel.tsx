import { CalendarDays, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Fragment } from "react";
import { eachDateKeyInRange } from "../dateUtils";
import { eyebrowClass, panelClass } from "../uiClasses";
import { TravelEvent } from "../types";

type GanttPanelProps = {
  events: TravelEvent[];
  rightPanelOpen: boolean;
  viewMode: "calendar" | "gantt";
  onRightPanelToggle: () => void;
  onViewModeChange: (mode: "calendar" | "gantt") => void;
  onEditEvent: (event: TravelEvent) => void;
};

export function GanttPanel({ events, rightPanelOpen, viewMode, onRightPanelToggle, onViewModeChange, onEditEvent }: GanttPanelProps) {
  const sortedEvents = [...events].sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));
  const firstDate = sortedEvents[0]?.startDate;
  const lastDate = sortedEvents.reduce((latest, event) => (event.endDate > latest ? event.endDate : latest), firstDate ?? "");
  const days = firstDate && lastDate ? eachDateKeyInRange(firstDate, lastDate) : [];
  const compactIconButtonClass =
    "grid h-8 w-8 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-950 hover:text-cyan-100";

  function gridColumnFor(event: TravelEvent) {
    const startIndex = days.indexOf(event.startDate);
    const endIndex = days.indexOf(event.endDate);
    return `${startIndex + 2} / ${endIndex + 3}`;
  }

  return (
    <section className={`${panelClass} flex min-h-0 flex-col p-1.5`} aria-label="Gantt da viagem">
      <header className="flex min-h-[34px] items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <div>
          <span className={`${eyebrowClass} inline-flex items-center gap-1.5`}>
            <CalendarDays size={12} />
            Gantt
          </span>
          <h1 className="text-[clamp(1rem,1.25vw,1.32rem)] font-extrabold leading-none text-white">Viagem</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
            <button
              className={`h-8 px-2.5 text-xs font-black ${viewMode === "calendar" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-cyan-950 hover:text-cyan-100"}`}
              type="button"
              onClick={() => onViewModeChange("calendar")}
            >
              Calendario
            </button>
            <button
              className={`h-8 px-2.5 text-xs font-black ${viewMode === "gantt" ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:bg-cyan-950 hover:text-cyan-100"}`}
              type="button"
              onClick={() => onViewModeChange("gantt")}
            >
              Gantt
            </button>
          </div>
          <button
            className={compactIconButtonClass}
            type="button"
            onClick={onRightPanelToggle}
            aria-label={rightPanelOpen ? "Fechar painel direito" : "Abrir painel direito"}
            title={rightPanelOpen ? "Fechar painel" : "Abrir painel"}
          >
            {rightPanelOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
          </button>
        </div>
      </header>

      {days.length === 0 ? (
        <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-slate-800 bg-slate-900 text-sm font-bold text-slate-400">
          Nenhum evento para visualizar.
        </div>
      ) : (
        <div className="mt-2 min-h-0 flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-2">
          <div
            className="grid min-w-max gap-1"
            style={{
              gridTemplateColumns: `180px repeat(${days.length}, minmax(76px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 rounded bg-slate-950 px-2 py-1 text-xs font-black text-slate-300">Evento</div>
            {days.map((day) => (
              <div className="rounded bg-slate-950 px-2 py-1 text-center text-xs font-black text-slate-300" key={day}>
                {day.slice(8, 10)}/{day.slice(5, 7)}
              </div>
            ))}

            {sortedEvents.map((event, index) => {
              const row = index + 2;

              return (
                <Fragment key={event.id}>
                <button
                  className="sticky left-0 z-10 min-w-0 rounded border border-slate-800 bg-slate-950 px-2 py-2 text-left hover:border-cyan-400 hover:bg-cyan-950"
                  key={`${event.id}-label`}
                  style={{ gridColumn: 1, gridRow: row }}
                  type="button"
                  onClick={() => onEditEvent(event)}
                >
                  <strong className="block truncate text-sm text-slate-100">{event.title}</strong>
                </button>
                <button
                  className="flex min-h-12 items-center rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2 text-left text-xs font-black text-cyan-100 hover:border-cyan-400 hover:bg-cyan-500/25"
                  key={`${event.id}-bar`}
                  style={{ gridColumn: gridColumnFor(event), gridRow: row }}
                  title={event.title}
                  type="button"
                  onClick={() => onEditEvent(event)}
                >
                  <span className="truncate">{event.title}</span>
                </button>
                </Fragment>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
