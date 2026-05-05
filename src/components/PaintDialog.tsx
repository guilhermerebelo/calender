import { type FormEvent } from "react";
import { Paintbrush, Palette, X } from "lucide-react";
import { paintColors } from "../constants";
import { eyebrowClass, iconButtonClass, inputClass, metaClass } from "../uiClasses";
import { PaintDraft } from "../types";

type PaintDialogProps = {
  draft: PaintDraft;
  error: string;
  colorPopoverOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onDraftChange: (draft: PaintDraft) => void;
  onColorPopoverToggle: () => void;
  onColorPopoverClose: () => void;
};

export function PaintDialog({
  draft,
  error,
  colorPopoverOpen,
  onClose,
  onSubmit,
  onDraftChange,
  onColorPopoverToggle,
  onColorPopoverClose,
}: PaintDialogProps) {
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/60 p-4" role="presentation" onMouseDown={onClose}>
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <span className={eyebrowClass}>Pintar calendario</span>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-white">Periodo</h2>
          </div>
          <button className={iconButtonClass} type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="grid gap-4 p-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Inicio
              <input className={inputClass} type="date" value={draft.startDate} onChange={(event) => onDraftChange({ ...draft, startDate: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Fim
              <input className={inputClass} type="date" value={draft.endDate} onChange={(event) => onDraftChange({ ...draft, endDate: event.target.value })} required />
            </label>
          </div>

          <div className="relative grid gap-2 text-sm font-extrabold text-slate-300">
            <span>Cor</span>
            <button className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-extrabold text-slate-100 shadow-sm shadow-black/20" type="button" onClick={onColorPopoverToggle}>
              <span className="h-[18px] w-[18px] rounded border border-slate-600" style={{ backgroundColor: draft.color }} />
              {draft.colorName}
              <Palette size={16} />
            </button>
            {colorPopoverOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 grid w-full max-w-[300px] grid-cols-2 gap-1.5 rounded-lg border border-slate-700 bg-slate-950 p-2 shadow-2xl shadow-black/40">
                {paintColors.map((color) => (
                  <button
                    className={`flex items-center gap-2 rounded-md border p-2 text-left text-slate-100 hover:bg-slate-900 ${
                      draft.color === color.value ? "border-cyan-400 bg-cyan-500/10" : "border-transparent"
                    }`}
                    key={color.id}
                    type="button"
                    onClick={() => {
                      onDraftChange({ ...draft, color: color.value, colorName: color.name });
                      onColorPopoverClose();
                    }}
                  >
                    <span className="h-4 w-4 rounded" style={{ backgroundColor: color.value }} />
                    {color.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="m-0 rounded-md border border-red-500/40 bg-red-950 p-2.5 text-sm font-semibold text-red-200">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className={metaClass}>
              <Paintbrush size={15} />
              Periodos pintados nao podem sobrescrever outros dias pintados.
            </span>
            <button className="h-9 rounded-md border border-cyan-500 bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-300" type="submit">
              Pintar periodo
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
