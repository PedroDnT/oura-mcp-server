import {
  ACTIVITY_SCIENCE,
  HRV_SCIENCE,
  SLEEP_SCIENCE,
  STRESS_SCIENCE,
  getRelevantScience,
} from "../knowledge/healthScience.js";
import type {
  DailyActivity,
  DailyCardiovascularAge,
  DailyReadiness,
  DailyResilience,
  DailySleep,
  DailySpo2,
  DailyStress,
  Sleep,
  VO2Max,
  Workout,
} from "../types.js";

export type CorrelationMethod = "spearman" | "pearson";

export type DailyRow = {
  day: string;
  sleep_score?: number;
  activity_score?: number;
  readiness_score?: number;
  stress_high_min?: number;
  recovery_high_min?: number;
  steps?: number;
  total_calories?: number;
  active_calories?: number;
  resilience_level?: string;
  spo2_avg?: number;
  breathing_disturbance_index?: number | null;
  cardiovascular_age?: number;
  vo2_max?: number;
  sleep_duration_h?: number;
  sleep_efficiency?: number;
  avg_hr?: number;
  avg_hrv?: number;
  temperature_delta?: number;
  respiratory_rate?: number;
  deep_pct?: number;
  rem_pct?: number;
  light_pct?: number;
  awake_pct?: number;
  bedtime_start?: string;
  bedtime_end?: string;
  bedtime_clock_min?: number;
  wake_clock_min?: number;
  midsleep_clock_min?: number;
  bedtime_deviation_min?: number;
  workout_count?: number;
  workout_intensity_score?: number;
};

export type CorrelationMatrix = {
  method: CorrelationMethod;
  labels: string[];
  matrix: Array<Array<number | null>>;
  counts: number[][];
};

export type LagCorrelation = {
  lag: number;
  r: number | null;
  n: number;
};

export type LagAnalysis = {
  id: string;
  title: string;
  xKey: keyof DailyRow;
  yKey: keyof DailyRow;
  lags: LagCorrelation[];
  best_lag: number | null;
  best_r: number | null;
};

export type DashboardChart =
  | {
      type: "heatmap";
      title: string;
      data: CorrelationMatrix;
    }
  | {
      type: "scatter";
      title: string;
      data: { xKey: keyof DailyRow; yKey: keyof DailyRow; lag?: number };
    }
  | {
      type: "bar";
      title: string;
      data: { xKey: keyof DailyRow; yKey: keyof DailyRow; lags: LagCorrelation[] };
    }
  | {
      type: "histogram";
      title: string;
      data: { key: keyof DailyRow; bins: Array<{ x0: number; x1: number; count: number }> };
    };

export type DashboardCard = {
  id: string;
  title: string;
  why_it_matters: string;
  science_notes: string[];
  charts: DashboardChart[];
  key_findings: string[];
};

export type DashboardsResult = {
  summary: {
    days: number;
    social_jetlag_min: number | null;
  };
  granularity_notes: string[];
  daily_rows: DailyRow[];
  correlation: CorrelationMatrix;
  correlation_detrended: CorrelationMatrix;
  lag_analyses: LagAnalysis[];
  cards: DashboardCard[];
};

const GRANULARITY_NOTES = [
  "Oura API max granularity: heart rate at 5-minute intervals.",
  "Sleep stages at 5-minute resolution; movement during sleep at 30-second resolution (when available).",
  "Raw/second-level sensor streams are not exposed via the public Oura API.",
];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function rank(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks: number[] = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j += 1;
    const avgRank = (i + j - 1) / 2 + 1;
    for (let k = i; k < j; k += 1) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 5) return null;
  const n = xs.length;
  const meanX = average(xs);
  const meanY = average(ys);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? null : num / den;
}

export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 5) return null;
  const rx = rank(xs);
  const ry = rank(ys);
  return pearson(rx, ry);
}

function correlate(method: CorrelationMethod, xs: number[], ys: number[]): number | null {
  return method === "spearman" ? spearman(xs, ys) : pearson(xs, ys);
}

function pairwise(xs: Array<number | undefined>, ys: Array<number | undefined>): {
  x: number[];
  y: number[];
} {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i += 1) {
    if (isNumber(xs[i]) && isNumber(ys[i])) {
      x.push(xs[i] as number);
      y.push(ys[i] as number);
    }
  }
  return { x, y };
}

function detrend(values: Array<number | undefined>, window = 7): Array<number | undefined> {
  const out: Array<number | undefined> = new Array(values.length).fill(undefined);
  for (let i = 0; i < values.length; i += 1) {
    if (!isNumber(values[i])) continue;
    const start = Math.max(0, i - window + 1);
    const slice: number[] = [];
    for (let j = start; j <= i; j += 1) {
      if (isNumber(values[j])) slice.push(values[j] as number);
    }
    if (slice.length === 0) continue;
    out[i] = (values[i] as number) - average(slice);
  }
  return out;
}

function correlationMatrix(
  rows: DailyRow[],
  keys: Array<keyof DailyRow>,
  method: CorrelationMethod
): CorrelationMatrix {
  const labels = keys.map(String);
  const valuesByKey = keys.map((k) => rows.map((r) => r[k] as number | undefined));
  const matrix: Array<Array<number | null>> = [];
  const counts: number[][] = [];

  for (let i = 0; i < keys.length; i += 1) {
    const row: Array<number | null> = [];
    const countRow: number[] = [];
    for (let j = 0; j < keys.length; j += 1) {
      const { x, y } = pairwise(valuesByKey[i], valuesByKey[j]);
      const r = correlate(method, x, y);
      row.push(r);
      countRow.push(x.length);
    }
    matrix.push(row);
    counts.push(countRow);
  }

  return { method, labels, matrix, counts };
}

function correlationMatrixDetrended(
  rows: DailyRow[],
  keys: Array<keyof DailyRow>,
  method: CorrelationMethod
): CorrelationMatrix {
  const labels = keys.map(String);
  const valuesByKey = keys.map((k) => detrend(rows.map((r) => r[k] as number | undefined)));
  const matrix: Array<Array<number | null>> = [];
  const counts: number[][] = [];

  for (let i = 0; i < keys.length; i += 1) {
    const row: Array<number | null> = [];
    const countRow: number[] = [];
    for (let j = 0; j < keys.length; j += 1) {
      const { x, y } = pairwise(valuesByKey[i], valuesByKey[j]);
      const r = correlate(method, x, y);
      row.push(r);
      countRow.push(x.length);
    }
    matrix.push(row);
    counts.push(countRow);
  }

  return { method, labels, matrix, counts };
}

function lagCorrelation(
  rows: DailyRow[],
  xKey: keyof DailyRow,
  yKey: keyof DailyRow,
  lag: number,
  method: CorrelationMethod
): LagCorrelation {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (const row of rows) {
    const targetDay = addDays(row.day, lag);
    const target = byDay.get(targetDay);
    const x = row[xKey];
    const y = target ? target[yKey] : undefined;
    if (isNumber(x) && isNumber(y)) {
      xs.push(x);
      ys.push(y);
    }
  }
  return {
    lag,
    r: correlate(method, xs, ys),
    n: xs.length,
  };
}

function computeLagAnalysis(
  rows: DailyRow[],
  xKey: keyof DailyRow,
  yKey: keyof DailyRow,
  maxLag: number,
  method: CorrelationMethod,
  id: string,
  title: string
): LagAnalysis {
  const lags: LagCorrelation[] = [];
  for (let lag = -maxLag; lag <= maxLag; lag += 1) {
    lags.push(lagCorrelation(rows, xKey, yKey, lag, method));
  }
  const best = lags
    .filter((l) => l.r !== null)
    .sort((a, b) => {
      const diff = Math.abs(b.r ?? 0) - Math.abs(a.r ?? 0);
      if (diff !== 0) return diff;
      return (b.lag ?? 0) - (a.lag ?? 0);
    })[0];

  return {
    id,
    title,
    xKey,
    yKey,
    lags,
    best_lag: best ? best.lag : null,
    best_r: best ? best.r : null,
  };
}

function clockMinutes(iso?: string): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function histogram(values: number[], binSize: number, min?: number, max?: number) {
  if (values.length === 0) return [];
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const start = Math.floor(lo / binSize) * binSize;
  const end = Math.ceil(hi / binSize) * binSize;
  const bins: Array<{ x0: number; x1: number; count: number }> = [];
  for (let b = start; b < end; b += binSize) {
    bins.push({ x0: b, x1: b + binSize, count: 0 });
  }
  for (const v of values) {
    const idx = Math.min(Math.floor((v - start) / binSize), bins.length - 1);
    if (idx >= 0 && bins[idx]) bins[idx].count += 1;
  }
  return bins;
}

export function buildDashboards(input: {
  sleep: DailySleep[];
  activity: DailyActivity[];
  readiness: DailyReadiness[];
  stress: DailyStress[];
  resilience: DailyResilience[];
  spo2: DailySpo2[];
  cardioAge: DailyCardiovascularAge[];
  vo2Max: VO2Max[];
  workouts: Workout[];
  sleepDetailed: Sleep[];
  correlationMethod: CorrelationMethod;
  maxLagDays: number;
}): DashboardsResult {
  const rowsByDay = new Map<string, DailyRow>();

  const ensureRow = (day: string) => {
    const existing = rowsByDay.get(day);
    if (existing) return existing;
    const row: DailyRow = { day };
    rowsByDay.set(day, row);
    return row;
  };

  for (const d of input.sleep) {
    const row = ensureRow(d.day);
    row.sleep_score = d.score;
  }

  for (const d of input.activity) {
    const row = ensureRow(d.day);
    row.activity_score = d.score;
    row.steps = d.steps;
    row.total_calories = d.total_calories;
    row.active_calories = d.active_calories;
  }

  for (const d of input.readiness) {
    const row = ensureRow(d.day);
    row.readiness_score = d.score;
  }

  for (const d of input.stress) {
    const row = ensureRow(d.day);
    row.stress_high_min = d.stress_high / 60;
    row.recovery_high_min = d.recovery_high / 60;
  }

  for (const d of input.resilience) {
    const row = ensureRow(d.day);
    row.resilience_level = d.level;
  }

  for (const d of input.spo2) {
    const row = ensureRow(d.day);
    row.spo2_avg = d.spo2_percentage?.average;
    row.breathing_disturbance_index = d.breathing_disturbance_index;
  }

  for (const d of input.cardioAge) {
    const row = ensureRow(d.day);
    row.cardiovascular_age = d.cardiovascular_age;
  }

  for (const d of input.vo2Max) {
    const row = ensureRow(d.day);
    row.vo2_max = d.vo2_max;
  }

  for (const s of input.sleepDetailed) {
    const row = ensureRow(s.day);
    row.sleep_duration_h = s.total_sleep_duration ? s.total_sleep_duration / 3600 : row.sleep_duration_h;
    row.sleep_efficiency = s.efficiency ?? row.sleep_efficiency;
    row.avg_hr = s.average_heart_rate ?? row.avg_hr;
    row.avg_hrv = s.average_hrv ?? row.avg_hrv;
    row.temperature_delta = s.temperature_delta ?? row.temperature_delta;
    row.respiratory_rate = s.respiratory_rate ?? row.respiratory_rate;
    row.bedtime_start = s.bedtime_start ?? row.bedtime_start;
    row.bedtime_end = s.bedtime_end ?? row.bedtime_end;

    if (s.total_sleep_duration && s.total_sleep_duration > 0) {
      row.deep_pct = (s.deep_sleep_duration / s.total_sleep_duration) * 100;
      row.rem_pct = (s.rem_sleep_duration / s.total_sleep_duration) * 100;
      row.light_pct = (s.light_sleep_duration / s.total_sleep_duration) * 100;
      const awake = s.awake_time ?? 0;
      row.awake_pct = (awake / s.total_sleep_duration) * 100;
    }
  }

  const workoutByDay = new Map<string, { count: number; intensityScore: number }>();
  for (const w of input.workouts) {
    const day = w.day;
    const entry = workoutByDay.get(day) ?? { count: 0, intensityScore: 0 };
    entry.count += 1;
    const weight = w.intensity === "hard" ? 3 : w.intensity === "moderate" ? 2 : 1;
    entry.intensityScore += weight;
    workoutByDay.set(day, entry);
  }
  for (const [day, data] of workoutByDay.entries()) {
    const row = ensureRow(day);
    row.workout_count = data.count;
    row.workout_intensity_score = data.intensityScore;
  }

  const dailyRows = Array.from(rowsByDay.values()).sort((a, b) => a.day.localeCompare(b.day));

  const bedtimes = dailyRows.map((r) => clockMinutes(r.bedtime_start)).filter(isNumber) as number[];
  const bedtimeMedian = median(bedtimes);
  for (const row of dailyRows) {
    row.bedtime_clock_min = clockMinutes(row.bedtime_start);
    row.wake_clock_min = clockMinutes(row.bedtime_end);
    if (row.bedtime_clock_min !== undefined && row.sleep_duration_h !== undefined) {
      const mid = row.bedtime_clock_min + row.sleep_duration_h * 60 * 0.5;
      row.midsleep_clock_min = mid % (24 * 60);
    }
    if (bedtimeMedian !== null && row.bedtime_clock_min !== undefined) {
      row.bedtime_deviation_min = row.bedtime_clock_min - bedtimeMedian;
    }
  }

  const weekendMid: number[] = [];
  const weekdayMid: number[] = [];
  for (const row of dailyRows) {
    if (!isNumber(row.midsleep_clock_min)) continue;
    const d = new Date(`${row.day}T00:00:00Z`);
    const day = d.getUTCDay();
    if (day === 0 || day === 6) weekendMid.push(row.midsleep_clock_min as number);
    else weekdayMid.push(row.midsleep_clock_min as number);
  }
  const socialJetlag = median(weekendMid) !== null && median(weekdayMid) !== null
    ? Math.abs((median(weekendMid) as number) - (median(weekdayMid) as number))
    : null;

  const metricKeys: Array<keyof DailyRow> = [
    "sleep_score",
    "readiness_score",
    "activity_score",
    "stress_high_min",
    "recovery_high_min",
    "steps",
    "avg_hrv",
    "avg_hr",
    "sleep_duration_h",
    "sleep_efficiency",
    "deep_pct",
    "rem_pct",
    "bedtime_clock_min",
    "workout_intensity_score",
    "spo2_avg",
    "breathing_disturbance_index",
    "vo2_max",
    "cardiovascular_age",
  ];

  const correlation = correlationMatrix(dailyRows, metricKeys, input.correlationMethod);
  const correlationDetrended = correlationMatrixDetrended(dailyRows, metricKeys, input.correlationMethod);

  const lagAnalyses: LagAnalysis[] = [
    computeLagAnalysis(
      dailyRows,
      "activity_score",
      "readiness_score",
      input.maxLagDays,
      input.correlationMethod,
      "lag_activity_readiness",
      "Activity → Readiness (lag)"
    ),
    computeLagAnalysis(
      dailyRows,
      "workout_intensity_score",
      "readiness_score",
      input.maxLagDays,
      input.correlationMethod,
      "lag_workout_readiness",
      "Training Load → Readiness (lag)"
    ),
    computeLagAnalysis(
      dailyRows,
      "stress_high_min",
      "sleep_score",
      input.maxLagDays,
      input.correlationMethod,
      "lag_stress_sleep",
      "Stress → Sleep (lag)"
    ),
    computeLagAnalysis(
      dailyRows,
      "sleep_duration_h",
      "readiness_score",
      input.maxLagDays,
      input.correlationMethod,
      "lag_sleep_readiness",
      "Sleep Duration → Readiness (lag)"
    ),
  ];

  const bedtimeBins = histogram(
    dailyRows
      .map((r) => r.bedtime_clock_min)
      .filter(isNumber) as number[],
    30,
    0,
    24 * 60
  );

  const cards: DashboardCard[] = [
    {
      id: "lag_lab",
      title: "Lag Lab",
      why_it_matters:
        "Training load and activity often affect readiness with a 1–3 day delay. Understanding your personal lag helps avoid overreaching.",
      science_notes: [
        ...getRelevantScience("activity").map((s) => s.finding),
        ...getRelevantScience("hrv").map((s) => s.finding),
      ],
      charts: [
        {
          type: "bar",
          title: "Activity → Readiness lag correlations",
          data: {
            xKey: "activity_score",
            yKey: "readiness_score",
            lags: lagAnalyses[0].lags,
          },
        },
        {
          type: "scatter",
          title: "Best-lag scatter (Activity vs Readiness)",
          data: {
            xKey: "activity_score",
            yKey: "readiness_score",
            lag: lagAnalyses[0].best_lag ?? 0,
          },
        },
      ],
      key_findings: [
        "Identify which lag days show the strongest correlation with readiness.",
      ],
    },
    {
      id: "sleep_architecture",
      title: "Sleep Architecture vs Recovery",
      why_it_matters:
        "Deep and REM proportions plus HRV are strong signals for physiological recovery quality.",
      science_notes: [
        ...SLEEP_SCIENCE.slice(0, 2).map((s) => s.finding),
        ...HRV_SCIENCE.slice(0, 2).map((s) => s.finding),
      ],
      charts: [
        {
          type: "scatter",
          title: "Deep sleep % vs Readiness",
          data: { xKey: "deep_pct", yKey: "readiness_score" },
        },
        {
          type: "scatter",
          title: "HRV vs Readiness",
          data: { xKey: "avg_hrv", yKey: "readiness_score" },
        },
      ],
      key_findings: [
        "Look for non-linear clusters (e.g., HRV plateaus at higher readiness).",
      ],
    },
    {
      id: "stress_sleep",
      title: "Stress-Sleep Coupling",
      why_it_matters:
        "High stress load often reduces sleep efficiency and quality; the relationship can be nonlinear.",
      science_notes: STRESS_SCIENCE.slice(0, 2).map((s) => s.finding),
      charts: [
        {
          type: "scatter",
          title: "Stress high minutes vs Sleep efficiency",
          data: { xKey: "stress_high_min", yKey: "sleep_efficiency" },
        },
        {
          type: "scatter",
          title: "Stress high minutes vs Sleep score",
          data: { xKey: "stress_high_min", yKey: "sleep_score" },
        },
      ],
      key_findings: [
        "Check if high-stress days predict lower sleep scores the same night.",
      ],
    },
    {
      id: "bedtime_consistency",
      title: "Bedtime Consistency Map",
      why_it_matters:
        "Bedtime regularity improves sleep quality and circadian alignment; deviations can erode sleep score.",
      science_notes: SLEEP_SCIENCE.slice(3, 4).map((s) => s.finding),
      charts: [
        {
          type: "histogram",
          title: "Bedtime distribution (minutes from midnight UTC)",
          data: { key: "bedtime_clock_min", bins: bedtimeBins },
        },
        {
          type: "scatter",
          title: "Bedtime deviation vs Sleep score",
          data: { xKey: "bedtime_deviation_min", yKey: "sleep_score" },
        },
      ],
      key_findings: [
        "Look for a ‘sweet spot’ range where sleep scores cluster higher.",
      ],
    },
    {
      id: "breathing_oxygen",
      title: "Breathing & Oxygen",
      why_it_matters:
        "Oxygen saturation and breathing disturbances can surface subtle recovery or respiratory issues.",
      science_notes: [
        "Lower SpO₂ or higher breathing disturbance index can coincide with worse recovery.",
      ],
      charts: [
        {
          type: "scatter",
          title: "SpO₂ average vs Sleep score",
          data: { xKey: "spo2_avg", yKey: "sleep_score" },
        },
        {
          type: "scatter",
          title: "Breathing disturbance vs Readiness",
          data: { xKey: "breathing_disturbance_index", yKey: "readiness_score" },
        },
      ],
      key_findings: [
        "If breathing disturbance increases, check for sleep score drops.",
      ],
    },
  ];

  return {
    summary: {
      days: dailyRows.length,
      social_jetlag_min: socialJetlag,
    },
    granularity_notes: GRANULARITY_NOTES,
    daily_rows: dailyRows,
    correlation,
    correlation_detrended: correlationDetrended,
    lag_analyses: lagAnalyses,
    cards,
  };
}

export const SCIENCE_SOURCES = {
  sleep: SLEEP_SCIENCE,
  hrv: HRV_SCIENCE,
  activity: ACTIVITY_SCIENCE,
  stress: STRESS_SCIENCE,
};
