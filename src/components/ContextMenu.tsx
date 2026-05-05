import { CalendarDays, Paintbrush, Plus } from "lucide-react";
import { fullDateLabel } from "../dateUtils";

type ContextMenuProps = {
  x: number;
  y: number;
  startDate: string;
  endDate: string;
  onViewDay: () => void;
  onAddEvent: () => void;
  onPaintCalendar: () => void;
};

export function ContextMenu({ x, y, startDate, endDate, onViewDay, onAddEvent, onPaintCalendar }: ContextMenuProps) {
  const hasRange = startDate !== endDate;

  return (
    <div
      className="fixed z-40 min-w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-slate-800 px-3 py-2 text-xs font-bold text-slate-400">
        {hasRange ? `${fullDateLabel(startDate)} - ${fullDateLabel(endDate)}` : fullDateLabel(startDate)}
      </div>
      <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-200 hover:bg-cyan-950 hover:text-cyan-100" type="button" onClick={onViewDay}>
        <CalendarDays size={16} />
        Ver dia
      </button>
      <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-200 hover:bg-cyan-950 hover:text-cyan-100" type="button" onClick={onAddEvent}>
        <Plus size={16} />
        {hasRange ? "Adicionar evento no periodo" : "Adicionar evento"}
      </button>
      <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-200 hover:bg-cyan-950 hover:text-cyan-100" type="button" onClick={onPaintCalendar}>
        <Paintbrush size={16} />
        {hasRange ? "Pintar periodo" : "Pintar calendario"}
      </button>
    </div>
  );
}
