import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { addMonths, buildMonthGrid, isDateKeyInRange, monthLabel } from "../dateUtils";
import { weekDays } from "../constants";
import { iconButtonClass, eyebrowClass, panelClass } from "../uiClasses";
import { PaintedPeriod, TravelEvent } from "../types";

type CalendarPanelProps = {
  visibleMonth: Date;
  eventsByDate: Record<string, TravelEvent[]>;
  expandedDays: Set<string>;
  paintedPeriods: PaintedPeriod[];
  rightPanelOpen: boolean;
  selectedRange: { startDate: string; endDate: string } | null;
  onVisibleMonthChange: (date: Date) => void;
  onRightPanelToggle: () => void;
  onDaySelect: (event: MouseEvent<HTMLDivElement>, date: string) => void;
  onDayCreate: (date: string) => void;
  onDayContextMenu: (event: MouseEvent<HTMLDivElement>, date: string) => void;
  onDayExpansionToggle: (event: MouseEvent<HTMLButtonElement>, date: string) => void;
};

export function CalendarPanel({
  visibleMonth,
  eventsByDate,
  expandedDays,
  paintedPeriods,
  rightPanelOpen,
  selectedRange,
  onVisibleMonthChange,
  onRightPanelToggle,
  onDaySelect,
  onDayCreate,
  onDayContextMenu,
  onDayExpansionToggle,
}: CalendarPanelProps) {
  const monthDays = buildMonthGrid(visibleMonth);

  function handleDayKeyDown(event: ReactKeyboardEvent<HTMLDivElement>, date: string) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onDayCreate(date);
  }

  function paintForDay(date: string) {
    return paintedPeriods.find((period) => isDateKeyInRange(date, period.startDate, period.endDate));
  }

  return (
    <section className={`${panelClass} flex min-h-0 flex-col p-3.5`} aria-label="Calendario">
      <header className="flex min-h-[50px] items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <span className={`${eyebrowClass} inline-flex items-center gap-1.5`}>
            <CalendarDays size={14} />
            Calendario
          </span>
          <h1 className="mt-1 text-[clamp(1.32rem,1.75vw,1.85rem)] font-extrabold leading-tight text-white">
            {monthLabel(visibleMonth)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className={iconButtonClass} type="button" onClick={() => onVisibleMonthChange(addMonths(visibleMonth, -1))} aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <button
            className="h-9 rounded-md border border-cyan-500 bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 transition hover:border-cyan-300 hover:bg-cyan-300"
            type="button"
            onClick={() => onVisibleMonthChange(new Date())}
          >
            Hoje
          </button>
          <button className={iconButtonClass} type="button" onClick={() => onVisibleMonthChange(addMonths(visibleMonth, 1))} aria-label="Proximo mes">
            <ChevronRight size={18} />
          </button>
          <button
            className={iconButtonClass}
            type="button"
            onClick={onRightPanelToggle}
            aria-label={rightPanelOpen ? "Fechar painel direito" : "Abrir painel direito"}
            title={rightPanelOpen ? "Fechar painel" : "Abrir painel"}
          >
            {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <span className="rounded-md bg-slate-900 px-2 py-1.5 text-center text-[0.72rem] font-black text-slate-300" key={day}>
            {day}
          </span>
        ))}
      </div>

      <div className="mt-2 grid min-h-[520px] flex-1 grid-cols-7 grid-rows-6 gap-2 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 p-2 lg:min-h-0 lg:max-h-[calc(100vh-118px)]">
        {monthDays.map((day) => {
          const dayEvents = eventsByDate[day.key] ?? [];
          const expanded = expandedDays.has(day.key);
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
              className={`min-h-0 cursor-pointer overflow-hidden rounded-lg border p-1.5 text-left outline-none transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-950/40 ${
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
              <div className="flex items-center justify-between gap-1">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-800 font-mono text-sm font-black">{day.date.getDate()}</span>
                <div className="flex items-center gap-1">
                  {painted && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: painted.color }} title={painted.colorName} />}
                  {dayEvents.length > 0 && (
                    <button
                      className="inline-flex h-6 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1.5 text-[0.72rem] font-black text-slate-300 hover:bg-cyan-950 hover:text-cyan-100"
                      type="button"
                      onClick={(event) => onDayExpansionToggle(event, day.key)}
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
                    <span className="block truncate rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-1 text-[0.68rem] text-cyan-100" key={event.id}>
                      {event.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
