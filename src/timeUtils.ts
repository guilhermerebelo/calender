export function nextHour(time: string) {
  const [hour = "9", minute = "0"] = time.split(":");
  const numericHour = Number(hour);

  if (!Number.isFinite(numericHour)) return "10:00";
  if (numericHour >= 23) return "23:59";

  return `${String(numericHour + 1).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}
