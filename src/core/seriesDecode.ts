export type DiscreteSeriesPoint = {
  timestamp: string;
  code: string;
  label: string;
};

export type DiscreteSeries = {
  raw: string;
  interval_sec: number;
  points: DiscreteSeriesPoint[];
};

export type NumericSeriesPoint = {
  timestamp: string;
  value: number;
};

export type NumericSeries = {
  interval_sec: number;
  points: NumericSeriesPoint[];
};

export const SLEEP_STAGE_LABELS: Record<string, string> = {
  "1": "deep",
  "2": "light",
  "3": "rem",
  "4": "awake",
};

export const MOVEMENT_LABELS: Record<string, string> = {
  "0": "still",
  "1": "low",
  "2": "medium",
  "3": "high",
  "4": "very_high",
};

export const ACTIVITY_CLASS_LABELS: Record<string, string> = {
  "0": "inactive",
  "1": "rest",
  "2": "low",
  "3": "medium",
  "4": "high",
  "5": "non_wear",
};

function addSecondsIso(startISO: string, seconds: number): string {
  const d = new Date(startISO);
  d.setUTCSeconds(d.getUTCSeconds() + seconds);
  return d.toISOString();
}

export function tokenizeSeries(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (/\s/.test(trimmed)) {
    return trimmed.split(/\s+/).map((v) => v.trim()).filter(Boolean);
  }
  return trimmed.split("");
}

export function decodeDiscreteSeries(
  raw: string | null | undefined,
  startISO: string | null | undefined,
  intervalSec: number,
  labels: Record<string, string>
): DiscreteSeries | null {
  if (!raw || !startISO) return null;
  const tokens = tokenizeSeries(raw);
  if (tokens.length === 0) return null;
  const points: DiscreteSeriesPoint[] = tokens.map((code, idx) => {
    const label = labels[code] ?? `unknown(${code})`;
    return {
      timestamp: addSecondsIso(startISO, idx * intervalSec),
      code,
      label,
    };
  });
  return { raw, interval_sec: intervalSec, points };
}

export function expandNumericSeries(
  items: number[] | null | undefined,
  startISO: string | null | undefined,
  intervalSec: number
): NumericSeries | null {
  if (!items || !startISO || items.length === 0) return null;
  const points: NumericSeriesPoint[] = items.map((value, idx) => ({
    timestamp: addSecondsIso(startISO, idx * intervalSec),
    value,
  }));
  return { interval_sec: intervalSec, points };
}
