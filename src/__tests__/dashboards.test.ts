import test from "node:test";
import assert from "node:assert/strict";

import { buildDashboards, spearman } from "../core/dashboards.js";
import type {
  DailyActivity,
  DailyReadiness,
  DailySleep,
  DailyStress,
  DailyResilience,
  DailySpo2,
  DailyCardiovascularAge,
  VO2Max,
  Workout,
  Sleep,
} from "../types.js";

test("dashboards: spearman correlation handles perfect monotonic", () => {
  const r = spearman([1, 2, 3, 4, 5], [1, 2, 3, 4, 5]);
  assert.ok(r !== null);
  assert.ok(Math.abs((r as number) - 1) < 1e-9);
});

test("dashboards: lag analysis finds correct lag", () => {
  const days = [
    "2024-01-01",
    "2024-01-02",
    "2024-01-03",
    "2024-01-04",
    "2024-01-05",
    "2024-01-06",
  ];

  const activity = days.map((day, idx) => ({
    id: `a${idx}`,
    day,
    score: idx + 1,
    steps: 1000,
    total_calories: 2000,
    active_calories: 500,
  })) as unknown as DailyActivity[];

  const readiness = days.map((day, idx) => ({
    id: `r${idx}`,
    day,
    score: idx === 0 ? 0 : idx,
  })) as unknown as DailyReadiness[];

  const dashboards = buildDashboards({
    sleep: [] as DailySleep[],
    activity,
    readiness,
    stress: [] as DailyStress[],
    resilience: [] as DailyResilience[],
    spo2: [] as DailySpo2[],
    cardioAge: [] as DailyCardiovascularAge[],
    vo2Max: [] as VO2Max[],
    workouts: [] as Workout[],
    sleepDetailed: [] as Sleep[],
    correlationMethod: "spearman",
    maxLagDays: 2,
  });

  const lag = dashboards.lag_analyses.find((l) => l.id === "lag_activity_readiness");
  assert.ok(lag);
  assert.equal(lag?.best_lag, 1);
});
