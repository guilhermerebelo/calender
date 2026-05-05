import { PaintColor } from "./types";

export const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
export const dayHours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);

export const paintColors: PaintColor[] = [
  { id: "sky", name: "Azul", value: "#38bdf8" },
  { id: "green", name: "Verde", value: "#22c55e" },
  { id: "amber", name: "Amarelo", value: "#f59e0b" },
  { id: "rose", name: "Rosa", value: "#fb7185" },
  { id: "violet", name: "Violeta", value: "#8b5cf6" },
  { id: "cyan", name: "Ciano", value: "#06b6d4" },
  { id: "lime", name: "Lima", value: "#84cc16" },
  { id: "red", name: "Vermelho", value: "#ef4444" },
  { id: "orange", name: "Laranja", value: "#f97316" },
  { id: "teal", name: "Turquesa", value: "#14b8a6" },
  { id: "indigo", name: "Indigo", value: "#6366f1" },
  { id: "purple", name: "Roxo", value: "#a855f7" },
  { id: "pink", name: "Pink", value: "#ec4899" },
  { id: "emerald", name: "Esmeralda", value: "#10b981" },
  { id: "blue", name: "Azul escuro", value: "#3b82f6" },
  { id: "slate", name: "Cinza", value: "#64748b" },
];

export const defaultColor = paintColors[0];
