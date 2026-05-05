import { Paintbrush, Plus } from "lucide-react";

type ContextMenuProps = {
  x: number;
  y: number;
  onAddEvent: () => void;
  onPaintCalendar: () => void;
};

export function ContextMenu({ x, y, onAddEvent, onPaintCalendar }: ContextMenuProps) {
  return (
    <div
      className="fixed z-40 min-w-52 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-2xl shadow-black/40"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-200 hover:bg-cyan-950 hover:text-cyan-100" type="button" onClick={onAddEvent}>
        <Plus size={16} />
        Adicionar evento
      </button>
      <button className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-slate-200 hover:bg-cyan-950 hover:text-cyan-100" type="button" onClick={onPaintCalendar}>
        <Paintbrush size={16} />
        Pintar calendario
      </button>
    </div>
  );
}
