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
];

export const defaultColor = paintColors[0];
