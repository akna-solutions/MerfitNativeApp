import { BodyMetric, BodyMetricPoint } from "./types";

function format(value: number, unit: "%" | "cm") {
  const rounded = Math.round(value * 10) / 10;
  return unit === "%" ? `%${rounded}` : `${rounded} cm`;
}

/**
 * Secilen araliktaki ilk ve son olcumden degisim satiri uretir ("%18 → %16.5 (−1.5)"). Iki olcumden azsa null.
 * Tahmini degerler "(tahmini)" ile isaretlenir; olculen ve tahmini degerler birbirinin yerine gecmez.
 */
export function describeBodyTrend(
  id: string,
  label: string,
  points: BodyMetricPoint[],
  unit: "%" | "cm",
): BodyMetric | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = Math.round((last.value - first.value) * 10) / 10;
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const estimated = sorted.some((point) => point.isEstimated) ? " (tahmini)" : "";
  return {
    id,
    label: `${label}${estimated}`,
    value: `${format(first.value, unit)} → ${format(last.value, unit)} (${sign}${Math.abs(delta)})`,
  };
}
