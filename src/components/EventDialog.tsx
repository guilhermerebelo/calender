import { type FormEvent } from "react";
import { MapPin, X } from "lucide-react";
import { fullDateLabel } from "../dateUtils";
import { eyebrowClass, iconButtonClass, inputClass, metaClass } from "../uiClasses";
import { EventDraft } from "../types";

type EventDialogProps = {
  draft: EventDraft;
  editing: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onDraftChange: (draft: EventDraft) => void;
};

export function EventDialog({ draft, editing, onClose, onSubmit, onDraftChange }: EventDialogProps) {
  const hasRange = draft.startDate !== draft.endDate;
  const datesAreComplete = /^\d{4}-\d{2}-\d{2}$/.test(draft.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(draft.endDate);

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
            <span className={eyebrowClass}>{editing ? "Editar" : "Novo"} evento</span>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-white">
              {datesAreComplete ? (hasRange ? `${fullDateLabel(draft.startDate)} - ${fullDateLabel(draft.endDate)}` : fullDateLabel(draft.startDate)) : "Periodo do evento"}
            </h2>
          </div>
          <button className={iconButtonClass} type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form className="grid gap-4 p-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-extrabold text-slate-300">
            Titulo
            <input className={inputClass} value={draft.title} onChange={(event) => onDraftChange({ ...draft, title: event.target.value })} autoFocus required />
          </label>
          <div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_1fr_1fr]">
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Data inicio
              <input className={inputClass} type="date" value={draft.startDate} onChange={(event) => onDraftChange({ ...draft, startDate: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Data fim
              <input className={inputClass} type="date" value={draft.endDate} onChange={(event) => onDraftChange({ ...draft, endDate: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Inicio
              <input className={inputClass} type="time" value={draft.startTime} onChange={(event) => onDraftChange({ ...draft, startTime: event.target.value })} required />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-slate-300">
              Fim
              <input className={inputClass} type="time" value={draft.endTime} onChange={(event) => onDraftChange({ ...draft, endTime: event.target.value })} required />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-extrabold text-slate-300">
            Comentarios
            <textarea className={`${inputClass} resize-y`} value={draft.comments} onChange={(event) => onDraftChange({ ...draft, comments: event.target.value })} rows={5} />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className={metaClass}>
              <MapPin size={15} />
              Planeje horarios, deslocamentos e reservas.
            </span>
            <button className="h-9 rounded-md border border-cyan-500 bg-cyan-500 px-4 text-sm font-extrabold text-slate-950 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-300" type="submit">
              Salvar evento
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
