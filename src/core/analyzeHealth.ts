import { ENDPOINTS } from "../constants.js";
import {
  getRecommendedProtocols,
  getRelevantScience,
  interpretMetrics,
} from "../knowledge/healthScience.js";
import type {
  DailyActivity,
  DailyReadiness,
  DailySleep,
  DailyStress,
  Workout,
} from "../types.js";

export type AnalyzeHealthInput = {
  sleep: DailySleep[];
  activity: DailyActivity[];
  readiness: DailyReadiness[];
  stress: DailyStress[];
  workouts: Workout[];
};

export type Trend = "improving" | "declining" | "stable";

export type HealthInsights = {
  summary: {
    days_analyzed: number;
    overall_health_score: number;
    key_metrics: {
      avg_sleep_score: number;
      avg_activity_score: number;
      avg_readiness_score: number;
      avg_stress_level: number;
    };
  };
  sleep: {
    avg_score: number;
    trend: Trend;
    best_day: string | null;
    worst_day: string | null;
    consistency_score: number;
    insights: string[];
  };
  activity: {
    avg_score: number;
    avg_steps: number;
    workout_frequency: number;
    trend: Trend;
    insights: string[];
  };
  readiness: {
    avg_score: number;
    well_rested_days: number;
    low_readiness_days: number;
    trend: Trend;
    insights: string[];
  };
  stress: {
    avg_stress_time: number;
    avg_recovery_time: number;
    stressed_days: number;
    restored_days: number;
    insights: string[];
  };
  workouts: {
    total_workouts: number;
    intensity_distribution: Record<string, number>;
    top_activities: Array<{ activity: string; count: number }>;
    insights: string[];
  };
  correlations: {
    sleep_readiness: number | null;
    activity_sleep: number | null;
    stress_sleep: number | null;
  };
  recommendations: Array<{
    category: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    recommendation: string;
    rationale?: string;
    protocol?: any;
    scientific_basis?: string[];
    action_steps?: string[];
  }>;
  key_insights: string[];
  science: {
    sleep: ReturnType<typeof getRelevantScience>;
    hrv: ReturnType<typeof getRelevantScience>;
    activity: ReturnType<typeof getRelevantScience>;
    stress: ReturnType<typeof getRelevantScience>;
  };
  endpoints_used: string[];
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calculateTrend(values: number[]): Trend {
  if (values.length < 7) return "stable";
  const mid = Math.floor(values.length / 2);
  const firstHalf = average(values.slice(0, mid));
  const secondHalf = average(values.slice(mid));
  const diff = secondHalf - firstHalf;
  if (diff > 2) return "improving";
  if (diff < -2) return "declining";
  return "stable";
}

function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 5) return null;
  const n = x.length;
  const meanX = average(x);
  const meanY = average(y);

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? null : num / den;
}

export function analyzeHealthData(data: AnalyzeHealthInput): HealthInsights {
  const insights: HealthInsights = {
    summary: {
      days_analyzed: 0,
      overall_health_score: 0,
      key_metrics: {
        avg_sleep_score: 0,
        avg_activity_score: 0,
        avg_readiness_score: 0,
        avg_stress_level: 0,
      },
    },
    sleep: {
      avg_score: 0,
      trend: "stable",
      best_day: null,
      worst_day: null,
      consistency_score: 0,
      insights: [],
    },
    activity: {
      avg_score: 0,
      avg_steps: 0,
      workout_frequency: 0,
      trend: "stable",
      insights: [],
    },
    readiness: {
      avg_score: 0,
      well_rested_days: 0,
      low_readiness_days: 0,
      trend: "stable",
      insights: [],
    },
    stress: {
      avg_stress_time: 0,
      avg_recovery_time: 0,
      stressed_days: 0,
      restored_days: 0,
      insights: [],
    },
    workouts: {
      total_workouts: 0,
      intensity_distribution: {},
      top_activities: [],
      insights: [],
    },
    correlations: {
      sleep_readiness: null,
      activity_sleep: null,
      stress_sleep: null,
    },
    recommendations: [],
    key_insights: [],
    science: {
      sleep: getRelevantScience("sleep"),
      hrv: getRelevantScience("hrv"),
      activity: getRelevantScience("activity"),
      stress: getRelevantScience("stress"),
    },
    endpoints_used: [
      ENDPOINTS.DAILY_SLEEP,
      ENDPOINTS.DAILY_ACTIVITY,
      ENDPOINTS.DAILY_READINESS,
      ENDPOINTS.DAILY_STRESS,
      ENDPOINTS.WORKOUT,
    ],
  };

  const days = Math.max(
    data.sleep.length,
    data.activity.length,
    data.readiness.length,
    data.stress.length
  );
  insights.summary.days_analyzed = days;

  // Sleep metrics
  if (data.sleep.length > 0) {
    const scores = data.sleep.map((d) => d.score);
    insights.sleep.avg_score = Math.round(average(scores));
    insights.sleep.trend = calculateTrend(scores);

    const sorted = [...data.sleep].sort((a, b) => b.score - a.score);
    insights.sleep.best_day = sorted[0]?.day ?? null;
    insights.sleep.worst_day = sorted[sorted.length - 1]?.day ?? null;

    const sd = Math.sqrt(
      average(scores.map((s) => Math.pow(s - average(scores), 2)))
    );
    insights.sleep.consistency_score = Math.max(0, Math.round(100 - sd * 3));

    insights.sleep.insights.push(
      `Your average sleep score is ${insights.sleep.avg_score} (${interpretMetrics(
        insights.sleep.avg_score,
        "sleep_score"
      )}).`
    );
    if (insights.sleep.consistency_score < 70) {
      insights.sleep.insights.push(
        "Sleep consistency appears variable. Stabilizing bedtime/wake time often improves scores."
      );
    }
  }

  // Activity metrics
  if (data.activity.length > 0) {
    const scores = data.activity.map((d) => d.score);
    insights.activity.avg_score = Math.round(average(scores));
    insights.activity.trend = calculateTrend(scores);
    insights.activity.avg_steps = Math.round(
      average(data.activity.map((d) => d.steps))
    );
    insights.activity.workout_frequency =
      data.workouts.length > 0
        ? Math.round((data.workouts.length / Math.max(1, days)) * 10) / 10
        : 0;

    insights.activity.insights.push(
      `Your average activity score is ${insights.activity.avg_score} (${interpretMetrics(
        insights.activity.avg_score,
        "activity_score"
      )}).`
    );
    insights.activity.insights.push(
      `Average steps: ${insights.activity.avg_steps.toLocaleString()}/day.`
    );
  }

  // Readiness metrics
  if (data.readiness.length > 0) {
    const scores = data.readiness.map((d) => d.score);
    insights.readiness.avg_score = Math.round(average(scores));
    insights.readiness.trend = calculateTrend(scores);
    insights.readiness.well_rested_days = data.readiness.filter((d) => d.score >= 80).length;
    insights.readiness.low_readiness_days = data.readiness.filter((d) => d.score < 65).length;

    insights.readiness.insights.push(
      `Your average readiness score is ${insights.readiness.avg_score} (${interpretMetrics(
        insights.readiness.avg_score,
        "readiness_score"
      )}).`
    );
  }

  // Stress metrics (Oura returns seconds)
  if (data.stress.length > 0) {
    insights.stress.avg_stress_time = Math.round(
      average(data.stress.map((d) => d.stress_high)) / 60
    );
    insights.stress.avg_recovery_time = Math.round(
      average(data.stress.map((d) => d.recovery_high)) / 60
    );
    insights.stress.stressed_days = data.stress.filter((d) => d.day_summary === "stressed").length;
    insights.stress.restored_days = data.stress.filter((d) => d.day_summary === "restored").length;

    insights.stress.insights.push(
      `Average high-stress time: ${insights.stress.avg_stress_time} min/day.`
    );
    insights.stress.insights.push(
      `Average high-recovery time: ${insights.stress.avg_recovery_time} min/day.`
    );
  }

  // Workout metrics
  insights.workouts.total_workouts = data.workouts.length;
  if (data.workouts.length > 0) {
    const intensity: Record<string, number> = {};
    const activityCounts: Record<string, number> = {};
    for (const w of data.workouts) {
      intensity[w.intensity] = (intensity[w.intensity] ?? 0) + 1;
      activityCounts[w.activity] = (activityCounts[w.activity] ?? 0) + 1;
    }
    insights.workouts.intensity_distribution = intensity;
    insights.workouts.top_activities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));
  }

  // Correlations (align by day)
  const byDay = <T extends { day: string }>(items: T[]): Map<string, T> =>
    new Map(items.map((i) => [i.day, i]));

  const sleepByDay = byDay(data.sleep);
  const actByDay = byDay(data.activity);
  const readByDay = byDay(data.readiness);
  const stressByDay = byDay(data.stress);

  const commonDays = Array.from(
    new Set([
      ...data.sleep.map((d) => d.day),
      ...data.activity.map((d) => d.day),
      ...data.readiness.map((d) => d.day),
      ...data.stress.map((d) => d.day),
    ])
  ).sort();

  const xsSleep: number[] = [];
  const ysReadiness: number[] = [];
  const xsAct: number[] = [];
  const ysSleep: number[] = [];
  const xsStress: number[] = [];
  const ysSleep2: number[] = [];

  for (const day of commonDays) {
    const s = sleepByDay.get(day);
    const r = readByDay.get(day);
    const a = actByDay.get(day);
    const st = stressByDay.get(day);

    if (s && r) {
      xsSleep.push(s.score);
      ysReadiness.push(r.score);
    }
    if (a && s) {
      xsAct.push(a.score);
      ysSleep.push(s.score);
    }
    if (st && s) {
      xsStress.push(st.stress_high);
      ysSleep2.push(s.score);
    }
  }

  insights.correlations.sleep_readiness = pearsonCorrelation(xsSleep, ysReadiness);
  insights.correlations.activity_sleep = pearsonCorrelation(xsAct, ysSleep);
  insights.correlations.stress_sleep = pearsonCorrelation(xsStress, ysSleep2);

  // Summary score
  const scoreParts = [
    insights.sleep.avg_score,
    insights.activity.avg_score,
    insights.readiness.avg_score,
  ].filter((n) => n > 0);
  insights.summary.overall_health_score =
    scoreParts.length > 0 ? Math.round(average(scoreParts)) : 0;

  insights.summary.key_metrics.avg_sleep_score = insights.sleep.avg_score;
  insights.summary.key_metrics.avg_activity_score = insights.activity.avg_score;
  insights.summary.key_metrics.avg_readiness_score = insights.readiness.avg_score;
  insights.summary.key_metrics.avg_stress_level = insights.stress.avg_stress_time;

  // Evidence-based recommendations with protocols
  const protocols = getRecommendedProtocols(insights);

  if (insights.sleep.avg_score > 0 && insights.sleep.avg_score < 70) {
    const sleepProtocol = protocols.find(
      (p) => p.name === "Sleep Optimization Protocol"
    );
    insights.recommendations.push({
      category: "🌙 Sleep Quality Optimization",
      priority: "HIGH",
      recommendation:
        "Your average sleep score is below optimal. Implement evidence-based sleep hygiene protocol.",
      rationale:
        "Sleep scores below 70 indicate significant room for improvement. Sleep consistency and timing often matter more than duration alone.",
      protocol: sleepProtocol,
    });
  }

  if (insights.activity.avg_steps > 0 && insights.activity.avg_steps < 7000) {
    insights.recommendations.push({
      category: "🏃 Daily Movement",
      priority: "MEDIUM",
      recommendation:
        "Increase daily step count to reach the minimum threshold associated with meaningful health benefits.",
      rationale: `Current average (${insights.activity.avg_steps} steps) is below 7,000 steps/day.`,
      action_steps: [
        "Add 1,000-2,000 steps daily (gradual increase)",
        "Take a 10-15 minute walk after meals",
        "Break up long sitting periods with short movement breaks",
      ],
    });
  }

  if (insights.readiness.avg_score > 0 && insights.readiness.avg_score < 75) {
    const recoveryProtocol = protocols.find(
      (p) => p.name === "Athletic Recovery Protocol"
    );
    insights.recommendations.push({
      category: "💪 Recovery Optimization",
      priority: "HIGH",
      recommendation:
        "Prioritize recovery to prevent overreaching and improve readiness.",
      rationale:
        `Low readiness (avg ${insights.readiness.avg_score}) suggests insufficient recovery. Consider reducing intensity on low-readiness days.`,
      protocol: recoveryProtocol,
    });
  }

  if (insights.stress.stressed_days > insights.stress.restored_days) {
    const stressProtocol = protocols.find(
      (p) => p.name === "Stress Reduction Protocol"
    );
    insights.recommendations.push({
      category: "🧘 Stress Management",
      priority: "HIGH",
      recommendation:
        "Implement a daily stress reduction protocol to improve recovery and sleep quality.",
      rationale:
        `More stressed days (${insights.stress.stressed_days}) than restored (${insights.stress.restored_days}) can indicate chronic stress load.`,
      protocol: stressProtocol,
    });
  }

  // Key insights (human-readable flags)
  if (insights.sleep.trend === "declining") {
    insights.key_insights.push(
      "⚠️ Your sleep quality trend is declining. Review recent lifestyle changes."
    );
  }
  if (insights.activity.workout_frequency > 5) {
    insights.key_insights.push(
      "💡 High workout frequency detected. Ensure adequate recovery between sessions."
    );
  }
  if (
    data.readiness.length > 0 &&
    insights.readiness.well_rested_days / data.readiness.length < 0.5
  ) {
    insights.key_insights.push(
      "📊 You're well-rested less than 50% of the time. Consider optimizing sleep and recovery."
    );
  }

  return insights;
}

export function getRatingEmoji(score: number): string {
  if (score >= 85) return "🌟";
  if (score >= 70) return "✅";
  if (score >= 55) return "⚠️";
  return "🔴";
}

export function getTrendEmoji(trend: string): string {
  if (trend === "improving") return "📈";
  if (trend === "declining") return "📉";
  return "➡️";
}

export function createProgressBar(value: number, max: number, label?: string): string {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  const emoji =
    percentage >= 85 ? "🌟" : percentage >= 70 ? "✅" : percentage >= 55 ? "⚠️" : "🔴";
  const labelText = label ? `${label}: ` : "";
  return `${labelText}[${bar}] ${percentage.toFixed(0)}% ${emoji}`;
}

