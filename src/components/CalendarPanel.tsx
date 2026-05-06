import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { addMonths, buildMonthGrid, isDateKeyInRange, monthLabel } from "../dateUtils";
import { weekDays } from "../constants";
import { eyebrowClass, panelClass } from "../uiClasses";
import { PaintedPeriod, TravelEvent } from "../types";

type CalendarPanelProps = {
  visibleMonth: Date;
  eventsByDate: Record<string, TravelEvent[]>;
  paintedPeriods: PaintedPeriod[];
  rightPanelOpen: boolean;
  viewMode: "calendar" | "gantt";
  selectedRange: { startDate: string; endDate: string } | null;
  onVisibleMonthChange: (date: Date) => void;
  onRightPanelToggle: () => void;
  onViewModeChange: (mode: "calendar" | "gantt") => void;
  onDaySelect: (event: MouseEvent<HTMLDivElement>, date: string) => void;
  onDayCreate: (date: string) => void;
  onDayView: (date: string) => void;
  onDayContextMenu: (event: MouseEvent<HTMLDivElement>, date: string) => void;
};

export function CalendarPanel({
  visibleMonth,
  eventsByDate,
  paintedPeriods,
  rightPanelOpen,
  viewMode,
  selectedRange,
  onVisibleMonthChange,
  onRightPanelToggle,
  onViewModeChange,
  onDaySelect,
  onDayCreate,
  onDayView,
  onDayContextMenu,
}: CalendarPanelProps) {
  const monthDays = buildMonthGrid(visibleMonth);
  const maxVisibleEvents = 1;
  const compactIconButtonClass =
    "grid h-8 w-8 place-items-center rounded-md border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-cyan-400 hover:bg-cyan-950 hover:text-cyan-100";

  function handleDayKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, date: string) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onDayCreate(date);
  }

  function paintForDay(date: string) {
    return paintedPeriods.find((period) => isDateKeyInRange(date, period.startDate, period.endDate));
  }

  return (
    <section className={`${panelClass} flex min-h-0 flex-col p-1.5`} aria-label="Calendario">
      <header className="flex min-h-[34px] items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
        <div>
          <span className={`${eyebrowClass} inline-flex items-center gap-1.5`}>
            <CalendarDays size={12} />
            Calendario
          </span>
          <h1 className="text-[clamp(1rem,1.25vw,1.32rem)] font-extrabold leading-none text-white">
            {monthLabel(visibleMonth)}
          </h1>
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
          <button className={compactIconButtonClass} type="button" onClick={() => onVisibleMonthChange(addMonths(visibleMonth, -1))} aria-label="Mes anterior">
            <ChevronLeft size={17} />
          </button>
          <button
            className="h-8 rounded-md border border-cyan-500 bg-cyan-500 px-2.5 text-xs font-extrabold text-slate-950 transition hover:border-cyan-300 hover:bg-cyan-300"
            type="button"
            onClick={() => onVisibleMonthChange(new Date())}
          >
            Hoje
          </button>
          <button className={compactIconButtonClass} type="button" onClick={() => onVisibleMonthChange(addMonths(visibleMonth, 1))} aria-label="Proximo mes">
            <ChevronRight size={17} />
          </button>
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

      <div className="mt-1.5 grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-center text-[0.64rem] font-black text-slate-300" key={day}>
            {day}
          </span>
        ))}
      </div>

      <div className="mt-1 grid min-h-[600px] flex-1 grid-cols-7 grid-rows-6 gap-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-1 lg:min-h-0 lg:max-h-[calc(100vh-66px)]">
        {monthDays.map((day) => {
          const dayEvents = eventsByDate[day.key] ?? [];
          const visibleEvents = dayEvents.slice(0, maxVisibleEvents);
          const hiddenEvents = Math.max(0, dayEvents.length - visibleEvents.length);
          const painted = paintForDay(day.key);
          const selected = selectedRange ? isDateKeyInRange(day.key, selectedRange.startDate, selectedRange.endDate) : false;
          const paintedStyle = painted
            ? {
                borderColor: painted.color,
                backgroundColor: `${painted.color}22`,
              }
            : undefined;

          return (
            <div
              className={`relative flex min-h-0 cursor-pointer flex-col justify-center overflow-hidden rounded-md border px-1.5 pb-1.5 pt-6 text-left outline-none transition hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-950/40 ${
                day.inCurrentMonth ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-800 bg-slate-900 text-slate-500"
              } ${day.isToday ? "ring-2 ring-cyan-400/70" : ""} ${selected ? "border-cyan-300 bg-cyan-500/15 shadow-inner shadow-cyan-950/60" : ""}`}
              key={day.key}
              onClick={(event) => onDaySelect(event, day.key)}
              onDoubleClick={() => onDayCreate(day.key)}
              onContextMenu={(event) => onDayContextMenu(event, day.key)}
              onKeyDown={(event) => handleDayKeyDown(event, day.key)}
              role="gridcell"
              aria-selected={selected}
              style={paintedStyle}
              tabIndex={0}
            >
              <span className="absolute left-1.5 top-1.5 grid h-5 w-5 place-items-center rounded bg-slate-800 font-mono text-xs font-black">{day.date.getDate()}</span>
              {painted && <span className="absolute right-1.5 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: painted.color }} title={painted.colorName} />}
              {dayEvents.length > 0 && (
                <div className="flex min-w-0 flex-col gap-1">
                  {visibleEvents.map((event) => (
                    <button
                      className="block min-h-[20px] w-full truncate rounded border border-cyan-500/25 bg-cyan-500/10 px-1.5 py-0.5 text-left text-xs leading-tight text-cyan-100 hover:border-cyan-400 hover:bg-cyan-950"
                      key={event.id}
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        onDayView(day.key);
                      }}
                      aria-label={`Ver agenda de ${day.date.getDate()}`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {hiddenEvents > 0 && (
                    <button
                      className="h-[20px] w-full truncate rounded border border-slate-700 bg-slate-900 px-1.5 text-left text-xs font-black leading-tight text-cyan-200 hover:border-cyan-400 hover:bg-cyan-950 hover:text-cyan-100"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDayView(day.key);
                      }}
                      aria-label={`Ver todos os eventos de ${day.date.getDate()}`}
                    >
                      +{hiddenEvents} eventos
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
