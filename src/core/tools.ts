import { z } from "zod";
import { CHARACTER_LIMIT, ENDPOINTS, ResponseFormat } from "../constants.js";
import { OuraClient } from "../services/ouraClient.js";
import {
  AnalysisSchema,
  DashboardsSchema,
  DateRangeWithPaginationSchema,
  DateTimeRangeWithPaginationSchema,
  RawEndpointSchema,
  type AnalysisParams,
  type DashboardsParams,
  type DateRangeWithPaginationParams,
  type DateTimeRangeWithPaginationParams,
  type RawEndpointParams,
} from "../schemas/index.js";
import type {
  DailyActivity,
  DailyCardiovascularAge,
  DailyReadiness,
  DailyResilience,
  DailySleep,
  DailySpo2,
  DailyStress,
  EnhancedTag,
  HeartRateResponse,
  PersonalInfo,
  RestModePeriod,
  RingConfiguration,
  Session,
  SleepResponse,
  SleepTime,
  Tag,
  VO2Max,
  Workout,
} from "../types.js";
import {
  analyzeHealthData,
  createProgressBar,
  getRatingEmoji,
  getTrendEmoji,
} from "./analyzeHealth.js";
import { buildDashboards } from "./dashboards.js";
import {
  ACTIVITY_CLASS_LABELS,
  MOVEMENT_LABELS,
  SLEEP_STAGE_LABELS,
  decodeDiscreteSeries,
  expandNumericSeries,
} from "./seriesDecode.js";
import { zodToInputSchemaSummary } from "./schemaSummary.js";

export type ToolContext = {
  token: string;
  now: Date;
  userAgent?: string;
};

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: Record<string, unknown>;
  structuredData?: unknown;
};

export type ToolListEntry = {
  name: string;
  title: string;
  description: string;
  inputSchema: unknown;
};

type ToolDef<TSchema extends z.ZodTypeAny> = {
  name: string;
  title: string;
  description: string;
  inputSchema: TSchema;
  handler: (params: z.infer<TSchema>, ctx: ToolContext) => Promise<{ text: string; structured: unknown }>;
};

function formatResponse(
  data: unknown,
  format: ResponseFormat,
  markdownFormatter: (data: any) => string
): { text: string; structured: unknown } {
  if (format === ResponseFormat.JSON) {
    return { text: JSON.stringify(data, null, 2), structured: data };
  }
  return { text: markdownFormatter(data), structured: data };
}

function truncateIfNeeded(text: string, structured: unknown): { text: string; structured: unknown } {
  if (text.length <= CHARACTER_LIMIT) return { text, structured };
  const warning =
    "\n\n---\n**⚠️ Response truncated due to size limit. Use smaller date ranges or specific filters to see complete data.**";
  return { text: text.substring(0, CHARACTER_LIMIT) + warning, structured };
}

function normalizeDateRange<T extends { start_date: string; end_date?: string }>(params: T): T {
  if (!params.end_date) {
    return { ...params, end_date: params.start_date };
  }
  return params;
}

function normalizeDateTimeRange<T extends { start_datetime: string; end_datetime?: string }>(
  params: T,
  now: Date
): T {
  if (!params.end_datetime) {
    return { ...params, end_datetime: now.toISOString() };
  }
  return params;
}

function paginationFrom(
  params: { page_limit?: number; max_records?: number } | undefined
): { maxPages?: number; maxItems?: number } {
  return {
    maxPages: params?.page_limit,
    maxItems: params?.max_records,
  };
}

const GRANULARITY_NOTE =
  "Granularity limits: Oura API max is 5-min heart rate, 5-min sleep stages, and 30-sec sleep movement (when available). Raw/second-level streams are not exposed.";

function seriesFromDailyScores<T extends { day: string }>(
  label: string,
  rows: T[],
  pick: (row: T) => number | null | undefined
) {
  return {
    name: label,
    points: rows
      .slice()
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((r) => ({ x: r.day, y: pick(r) ?? null })),
  };
}

export const TOOL_DEFS: Array<ToolDef<any>> = [
  {
    name: "oura_get_heartrate",
    title: "Get Heart Rate Data",
    description:
      "Get heart rate measurements at 5-minute intervals. Most granular cardiovascular data available from Oura.",
    inputSchema: DateTimeRangeWithPaginationSchema,
    handler: async (params: DateTimeRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateTimeRange(params, ctx.now);
      const response = await client.makeRequestAllPages<HeartRateResponse>(
        ENDPOINTS.HEARTRATE,
        {
          start_datetime: normalized.start_datetime,
          end_datetime: normalized.end_datetime,
        },
        paginationFrom(params)
      );

      const structured = {
        data: response.data,
        next_token: response.next_token,
        granularity_notes: [GRANULARITY_NOTE],
      };

      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Heart Rate Data\n`];
        const samples = data.data ?? [];
        lines.push(`**Total samples:** ${samples.length}\n`);
        if (samples.length === 0) {
          lines.push("No heart rate data found for this period.\n");
        } else {
          lines.push(
            `**Time range:** ${samples[0].timestamp} to ${samples[samples.length - 1].timestamp}\n`
          );
          lines.push(`## Samples\n`);
          for (const sample of samples.slice(0, 100)) {
            const time = new Date(sample.timestamp).toLocaleString();
            lines.push(`- **${time}**: ${sample.bpm} bpm (${sample.source})`);
          }
          if (samples.length > 100) lines.push(`\n*... and ${samples.length - 100} more samples*`);
        }
        lines.push(`\n${GRANULARITY_NOTE}`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_sleep_detailed",
    title: "Get Detailed Sleep Data",
    description:
      "Get comprehensive sleep data including HRV, movement, and hypnogram at maximum granularity.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<SleepResponse>(
        ENDPOINTS.SLEEP,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const enriched = response.data.map((sleep) => ({
        ...sleep,
        decoded: {
          sleep_phase_5_min: decodeDiscreteSeries(
            sleep.sleep_phase_5_min,
            sleep.bedtime_start,
            300,
            SLEEP_STAGE_LABELS
          ),
          movement_30_sec: decodeDiscreteSeries(
            sleep.movement_30_sec,
            sleep.bedtime_start,
            30,
            MOVEMENT_LABELS
          ),
          heart_rate: sleep.heart_rate
            ? expandNumericSeries(
                sleep.heart_rate.items,
                sleep.heart_rate.timestamp,
                sleep.heart_rate.interval
              )
            : null,
          hrv: sleep.hrv
            ? expandNumericSeries(
                sleep.hrv.items,
                sleep.hrv.timestamp,
                sleep.hrv.interval
              )
            : null,
        },
      }));

      const structured = {
        data: enriched,
        next_token: response.next_token,
        granularity_notes: [GRANULARITY_NOTE],
      };

      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines: string[] = [`# Detailed Sleep Data\n`];
        const records = data.data ?? [];
        lines.push(`**Total sleep records:** ${records.length}\n`);
        if (records.length === 0) return lines.join("\n");

        for (const sleep of records.slice(0, 10)) {
          lines.push(`## ${sleep.day} (${sleep.type})`);
          lines.push(`- Duration: ${(sleep.total_sleep_duration / 3600).toFixed(1)} hours`);
          lines.push(`- Efficiency: ${sleep.efficiency}%`);
          lines.push(`- Avg HR: ${sleep.average_heart_rate} bpm (lowest: ${sleep.lowest_heart_rate} bpm)`);
          lines.push(`- Avg HRV: ${sleep.average_hrv} ms`);
          if (sleep.sleep_phase_5_min) lines.push(`- Sleep stage data: available (5-min resolution)`);
          if (sleep.movement_30_sec) lines.push(`- Movement data: available (30-sec resolution)`);
          lines.push("");
        }
        if (records.length > 10) lines.push(`*... and ${records.length - 10} more sleep records*`);
        lines.push(`\n${GRANULARITY_NOTE}`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_sleep",
    title: "Get Daily Sleep Scores",
    description: "Get daily sleep summaries and scores.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailySleep[]; next_token: string | null }>(
        ENDPOINTS.DAILY_SLEEP,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Daily Sleep Scores\n`];
        const rows = data.data ?? [];
        lines.push(`**Days:** ${rows.length}\n`);
        for (const d of rows) lines.push(`- ${d.day}: ${d.score}`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_activity",
    title: "Get Daily Activity Metrics",
    description: "Get daily activity metrics including steps, calories, and activity score.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailyActivity[]; next_token: string | null }>(
        ENDPOINTS.DAILY_ACTIVITY,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const enriched = response.data.map((activity) => ({
        ...activity,
        decoded: {
          class_5_min: decodeDiscreteSeries(
            activity.class_5_min,
            activity.timestamp,
            300,
            ACTIVITY_CLASS_LABELS
          ),
          met: activity.met
            ? expandNumericSeries(activity.met.items, activity.met.timestamp, activity.met.interval)
            : null,
        },
      }));

      const structured = {
        data: enriched,
        next_token: response.next_token,
        granularity_notes: [GRANULARITY_NOTE],
      };

      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Daily Activity\n`];
        const rows = data.data ?? [];
        lines.push(`**Days:** ${rows.length}\n`);
        for (const d of rows) {
          lines.push(`- ${d.day}: score ${d.score}, steps ${d.steps.toLocaleString()}, calories ${d.total_calories}`);
        }
        lines.push(`\n${GRANULARITY_NOTE}`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_readiness",
    title: "Get Daily Readiness Scores",
    description: "Get readiness scores and recovery metrics.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailyReadiness[]; next_token: string | null }>(
        ENDPOINTS.DAILY_READINESS,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Daily Readiness\n`];
        const rows = data.data ?? [];
        lines.push(`**Days:** ${rows.length}\n`);
        for (const d of rows) lines.push(`- ${d.day}: ${d.score}`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_stress",
    title: "Get Daily Stress & Recovery",
    description: "Get daily stress and recovery time metrics.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailyStress[]; next_token: string | null }>(
        ENDPOINTS.DAILY_STRESS,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Daily Stress\n`];
        const rows = data.data ?? [];
        lines.push(`**Days:** ${rows.length}\n`);
        for (const d of rows) {
          lines.push(
            `- ${d.day}: summary ${d.day_summary ?? "n/a"}, stress_high ${(d.stress_high / 60).toFixed(
              0
            )} min, recovery_high ${(d.recovery_high / 60).toFixed(0)} min`
          );
        }
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_workout",
    title: "Get Workouts",
    description: "Get workout sessions, including intensity and (when present) heart rate series.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: Workout[]; next_token: string | null }>(
        ENDPOINTS.WORKOUT,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );

      const enriched = response.data.map((workout) => ({
        ...workout,
        decoded_heart_rate: workout.heart_rate
          ? expandNumericSeries(
              workout.heart_rate.items,
              workout.heart_rate.timestamp,
              workout.heart_rate.interval
            )
          : null,
      }));

      const structured = { data: enriched, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines = [`# Workouts\n`];
        const rows = data.data ?? [];
        lines.push(`**Workouts:** ${rows.length}\n`);
        for (const w of rows.slice(0, 50)) {
          lines.push(
            `- ${w.day}: ${w.activity} (${w.intensity}) ${w.calories} kcal, ${w.distance} m`
          );
        }
        if (rows.length > 50) lines.push(`\n*... and ${rows.length - 50} more workouts*`);
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_resilience",
    title: "Get Daily Resilience",
    description: "Get daily resilience levels and contributors.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailyResilience[]; next_token: string | null }>(
        ENDPOINTS.DAILY_RESILIENCE,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Daily Resilience\n`, `**Days:** ${rows.length}\n`];
        for (const d of rows) lines.push(`- ${d.day}: ${d.level}`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_spo2",
    title: "Get Daily SpO2",
    description: "Get daily blood oxygen saturation and breathing disturbance index.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailySpo2[]; next_token: string | null }>(
        ENDPOINTS.DAILY_SPO2,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Daily SpO2\n`, `**Days:** ${rows.length}\n`];
        for (const d of rows) {
          lines.push(`- ${d.day}: SpO2 avg ${d.spo2_percentage?.average ?? "n/a"}%, BDI ${d.breathing_disturbance_index ?? "n/a"}`);
        }
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_daily_cardiovascular_age",
    title: "Get Daily Cardiovascular Age",
    description: "Get daily cardiovascular age estimates.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: DailyCardiovascularAge[]; next_token: string | null }>(
        ENDPOINTS.DAILY_CARDIOVASCULAR_AGE,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Daily Cardiovascular Age\n`, `**Days:** ${rows.length}\n`];
        for (const d of rows) lines.push(`- ${d.day}: ${d.cardiovascular_age}`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_vo2_max",
    title: "Get VO2 Max",
    description: "Get VO2 max estimates.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: VO2Max[]; next_token: string | null }>(
        ENDPOINTS.VO2_MAX,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# VO2 Max\n`, `**Days:** ${rows.length}\n`];
        for (const d of rows) lines.push(`- ${d.day}: ${d.vo2_max}`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_sleep_time",
    title: "Get Sleep Time",
    description: "Get sleep time windows and timing metrics.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: SleepTime[]; next_token: string | null }>(
        ENDPOINTS.SLEEP_TIME,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Sleep Time\n`, `**Days:** ${rows.length}\n`];
        for (const d of rows) {
          lines.push(`- ${d.day}: ${d.bedtime_start ?? "n/a"} → ${d.bedtime_end ?? "n/a"}`);
        }
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_session",
    title: "Get Sessions",
    description: "Get session entries (e.g., meditation, breathwork, etc.).",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: Session[]; next_token: string | null }>(
        ENDPOINTS.SESSION,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Sessions\n`, `**Sessions:** ${rows.length}\n`];
        for (const s of rows.slice(0, 50)) {
          lines.push(`- ${s.day ?? "n/a"}: ${s.type ?? "session"} (${s.start_datetime ?? "n/a"})`);
        }
        if (rows.length > 50) lines.push(`\n*... and ${rows.length - 50} more sessions*`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_enhanced_tag",
    title: "Get Enhanced Tags",
    description: "Get enhanced tags with time ranges and comments.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: EnhancedTag[]; next_token: string | null }>(
        ENDPOINTS.ENHANCED_TAG,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Enhanced Tags\n`, `**Tags:** ${rows.length}\n`];
        for (const t of rows.slice(0, 50)) {
          lines.push(`- ${t.start_day} → ${t.end_day}: ${t.tag_type_code}${t.comment ? ` (${t.comment})` : ""}`);
        }
        if (rows.length > 50) lines.push(`\n*... and ${rows.length - 50} more tags*`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_tag",
    title: "Get Tags",
    description: "Get user tags (legacy/simple tags).",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: Tag[]; next_token: string | null }>(
        ENDPOINTS.TAG,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Tags\n`, `**Tags:** ${rows.length}\n`];
        for (const t of rows.slice(0, 50)) {
          lines.push(`- ${t.day ?? "n/a"}: ${t.tag_type_code ?? "tag"}${t.comment ? ` (${t.comment})` : ""}`);
        }
        if (rows.length > 50) lines.push(`\n*... and ${rows.length - 50} more tags*`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_rest_mode_period",
    title: "Get Rest Mode Periods",
    description: "Get rest mode periods.",
    inputSchema: DateRangeWithPaginationSchema,
    handler: async (params: DateRangeWithPaginationParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const normalized = normalizeDateRange(params);
      const response = await client.makeRequestAllPages<{ data: RestModePeriod[]; next_token: string | null }>(
        ENDPOINTS.REST_MODE_PERIOD,
        {
          start_date: normalized.start_date,
          end_date: normalized.end_date,
        },
        paginationFrom(params)
      );
      const structured = { data: response.data, next_token: response.next_token };
      const formatted = formatResponse(structured, params.response_format, (data) => {
        const rows = data.data ?? [];
        const lines = [`# Rest Mode Periods\n`, `**Periods:** ${rows.length}\n`];
        for (const r of rows.slice(0, 50)) {
          lines.push(`- ${r.start_date} → ${r.end_date}${r.reason ? ` (${r.reason})` : ""}`);
        }
        if (rows.length > 50) lines.push(`\n*... and ${rows.length - 50} more periods*`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_ring_configuration",
    title: "Get Ring Configuration",
    description: "Get ring configuration details (hardware, firmware, design).",
    inputSchema: z
      .object({
        response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
      })
      .strict(),
    handler: async (params: { response_format: ResponseFormat }, ctx) => {
      const client = new OuraClient(ctx.token);
      const response = await client.makeRequest<RingConfiguration>(ENDPOINTS.RING_CONFIGURATION);
      const formatted = formatResponse(response, params.response_format, (data) => {
        const lines = [`# Ring Configuration\n`];
        lines.push(`- Hardware: ${data.hardware_type}`);
        lines.push(`- Firmware: ${data.firmware_version}`);
        lines.push(`- Design: ${data.design}`);
        lines.push(`- Color: ${data.color}`);
        lines.push(`- Setup date: ${data.set_up_at}`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_raw_endpoint",
    title: "Get Raw Endpoint Data",
    description: "Fetch raw JSON from any supported Oura v2 usercollection endpoint.",
    inputSchema: RawEndpointSchema,
    handler: async (params: RawEndpointParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const { endpoint, params: queryParams, page_limit, max_records } = params;
      const shouldPage = Boolean(page_limit || max_records);

      const response = shouldPage
        ? await client.makeRequestAllPages<any>(
            endpoint,
            queryParams as Record<string, string | number | undefined>,
            paginationFrom({ page_limit, max_records })
          )
        : await client.makeRequestPage<any>(
            endpoint,
            queryParams as Record<string, string | number | undefined>
          );

      const formatted = formatResponse(response, params.response_format, (data) => {
        const lines = [`# Raw Endpoint Data\n`, `Endpoint: ${endpoint}\n`];
        if (data?.data && Array.isArray(data.data)) {
          lines.push(`Records: ${data.data.length}`);
        }
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_generate_science_dashboards",
    title: "Generate Science Dashboards",
    description:
      "Generate evidence-backed dashboards with correlations, lag effects, and derived insights.",
    inputSchema: DashboardsSchema,
    handler: async (params: DashboardsParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const [
        sleep,
        activity,
        readiness,
        stress,
        resilience,
        spo2,
        cardioAge,
        vo2Max,
        workouts,
        sleepDetailed,
      ] = await Promise.all([
        client.makeRequestAllPages<{ data: DailySleep[]; next_token: string | null }>(
          ENDPOINTS.DAILY_SLEEP,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailyActivity[]; next_token: string | null }>(
          ENDPOINTS.DAILY_ACTIVITY,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailyReadiness[]; next_token: string | null }>(
          ENDPOINTS.DAILY_READINESS,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailyStress[]; next_token: string | null }>(
          ENDPOINTS.DAILY_STRESS,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailyResilience[]; next_token: string | null }>(
          ENDPOINTS.DAILY_RESILIENCE,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailySpo2[]; next_token: string | null }>(
          ENDPOINTS.DAILY_SPO2,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: DailyCardiovascularAge[]; next_token: string | null }>(
          ENDPOINTS.DAILY_CARDIOVASCULAR_AGE,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: VO2Max[]; next_token: string | null }>(
          ENDPOINTS.VO2_MAX,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<{ data: Workout[]; next_token: string | null }>(
          ENDPOINTS.WORKOUT,
          { start_date: params.start_date, end_date: params.end_date }
        ),
        client.makeRequestAllPages<SleepResponse>(ENDPOINTS.SLEEP, {
          start_date: params.start_date,
          end_date: params.end_date,
        }),
      ]);

      const dashboards = buildDashboards({
        sleep: sleep.data,
        activity: activity.data,
        readiness: readiness.data,
        stress: stress.data,
        resilience: resilience.data,
        spo2: spo2.data,
        cardioAge: cardioAge.data,
        vo2Max: vo2Max.data,
        workouts: workouts.data,
        sleepDetailed: sleepDetailed.data,
        correlationMethod: params.correlation_method,
        maxLagDays: params.max_lag_days,
      });

      const formatted = formatResponse(dashboards, params.response_format, (data) => {
        const lines: string[] = [];
        lines.push("# Science Dashboards\n");
        lines.push(`**Days:** ${data.summary.days}`);
        lines.push(
          `**Social jetlag (min):** ${data.summary.social_jetlag_min ?? "n/a"}`
        );
        lines.push("\n## Dashboards\n");
        for (const card of data.cards) {
          lines.push(`### ${card.title}`);
          lines.push(card.why_it_matters);
        }
        lines.push("\n## Notes\n");
        for (const note of data.granularity_notes) lines.push(`- ${note}`);
        lines.push("- Correlation does not imply causation.");
        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_get_personal_info",
    title: "Get Personal Info",
    description: "Get user profile details (age, sex, height, weight, email).",
    inputSchema: z
      .object({
        response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN),
      })
      .strict(),
    handler: async (params: { response_format: ResponseFormat }, ctx) => {
      const client = new OuraClient(ctx.token);
      const response = await client.makeRequest<PersonalInfo>(ENDPOINTS.PERSONAL_INFO);
      const formatted = formatResponse(response, params.response_format, (data) => {
        const lines = [`# Personal Info\n`];
        lines.push(`- Age: ${data.age}`);
        lines.push(`- Biological sex: ${data.biological_sex}`);
        lines.push(`- Height: ${data.height}`);
        lines.push(`- Weight: ${data.weight}`);
        lines.push(`- Email: ${data.email}`);
        return lines.join("\n");
      });
      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
  {
    name: "oura_analyze_health_trends",
    title: "Analyze Health Trends & Generate Insights Report",
    description:
      "Analyze sleep/activity/readiness/stress/workouts for a date range and generate a comprehensive insights report.",
    inputSchema: AnalysisSchema,
    handler: async (params: AnalysisParams, ctx) => {
      const client = new OuraClient(ctx.token);
      const [sleepData, activityData, readinessData, stressData, workoutData] = await Promise.all([
        client.makeRequestAllPages<{ data: DailySleep[]; next_token: string | null }>(
          ENDPOINTS.DAILY_SLEEP,
          {
            start_date: params.start_date,
            end_date: params.end_date,
          }
        ),
        client.makeRequestAllPages<{ data: DailyActivity[]; next_token: string | null }>(
          ENDPOINTS.DAILY_ACTIVITY,
          {
            start_date: params.start_date,
            end_date: params.end_date,
          }
        ),
        client.makeRequestAllPages<{ data: DailyReadiness[]; next_token: string | null }>(
          ENDPOINTS.DAILY_READINESS,
          {
            start_date: params.start_date,
            end_date: params.end_date,
          }
        ),
        client.makeRequestAllPages<{ data: DailyStress[]; next_token: string | null }>(
          ENDPOINTS.DAILY_STRESS,
          {
            start_date: params.start_date,
            end_date: params.end_date,
          }
        ),
        client.makeRequestAllPages<{ data: Workout[]; next_token: string | null }>(ENDPOINTS.WORKOUT, {
          start_date: params.start_date,
          end_date: params.end_date,
        }),
      ]);

      const insights = analyzeHealthData({
        sleep: sleepData.data,
        activity: activityData.data,
        readiness: readinessData.data,
        stress: stressData.data,
        workouts: workoutData.data,
      });

      const series = [
        seriesFromDailyScores("Sleep score", sleepData.data, (d) => (d as any).score),
        seriesFromDailyScores("Activity score", activityData.data, (d) => (d as any).score),
        seriesFromDailyScores("Readiness score", readinessData.data, (d) => (d as any).score),
        seriesFromDailyScores("Steps", activityData.data, (d) => (d as any).steps),
        seriesFromDailyScores("Stress high (min)", stressData.data, (d) => (d as any).stress_high / 60),
        seriesFromDailyScores("Recovery high (min)", stressData.data, (d) => (d as any).recovery_high / 60),
      ].filter((s) => Array.isArray(s.points) && s.points.length > 0);

      const structured = {
        ...insights,
        series,
        raw: {
          sleep: sleepData.data,
          activity: activityData.data,
          readiness: readinessData.data,
          stress: stressData.data,
          workouts: workoutData.data,
        },
      };

      const formatted = formatResponse(structured, params.response_format, (data) => {
        const lines: string[] = [];
        lines.push(`╔══════════════════════════════════════════════════════════════════╗`);
        lines.push(`║     📊 COMPREHENSIVE HEALTH INSIGHTS REPORT 📊                  ║`);
        lines.push(`╚══════════════════════════════════════════════════════════════════╝\n`);
        lines.push(`📅 **Analysis Period:** ${params.start_date} to ${params.end_date}`);
        lines.push(`📈 **Days Analyzed:** ${data.summary.days_analyzed} days`);
        lines.push(`🔬 **Evidence-Based Analysis with Scientific References**\n`);
        lines.push(`${"=".repeat(70)}\n`);

        lines.push(`## 😴 SLEEP\n`);
        lines.push(createProgressBar(data.sleep.avg_score, 100, "Sleep score"));
        lines.push(`Trend: ${getTrendEmoji(data.sleep.trend)} ${data.sleep.trend}`);
        lines.push(`Consistency: ${data.sleep.consistency_score}%`);
        if (data.sleep.best_day) lines.push(`Best day: ${data.sleep.best_day}`);
        if (data.sleep.worst_day) lines.push(`Worst day: ${data.sleep.worst_day}`);
        if (data.sleep.insights?.length) {
          lines.push(`\nInsights:`);
          for (const i of data.sleep.insights) lines.push(`- ${i}`);
        }
        lines.push(`\n${"-".repeat(70)}\n`);

        lines.push(`## 🏃 ACTIVITY\n`);
        lines.push(createProgressBar(data.activity.avg_score, 100, "Activity score"));
        lines.push(`Steps/day: ${data.activity.avg_steps.toLocaleString()}`);
        lines.push(`Workout frequency: ${data.activity.workout_frequency}/day`);
        lines.push(`Trend: ${getTrendEmoji(data.activity.trend)} ${data.activity.trend}`);
        if (data.activity.insights?.length) {
          lines.push(`\nInsights:`);
          for (const i of data.activity.insights) lines.push(`- ${i}`);
        }
        lines.push(`\n${"-".repeat(70)}\n`);

        lines.push(`## 💪 READINESS\n`);
        lines.push(createProgressBar(data.readiness.avg_score, 100, "Readiness score"));
        lines.push(`Trend: ${getTrendEmoji(data.readiness.trend)} ${data.readiness.trend}`);
        lines.push(`Well-rested days: ${data.readiness.well_rested_days}`);
        lines.push(`Low readiness days: ${data.readiness.low_readiness_days}`);
        if (data.readiness.insights?.length) {
          lines.push(`\nInsights:`);
          for (const i of data.readiness.insights) lines.push(`- ${i}`);
        }
        lines.push(`\n${"-".repeat(70)}\n`);

        lines.push(`## 🧘 STRESS\n`);
        lines.push(`Avg high-stress: ${data.stress.avg_stress_time} min/day`);
        lines.push(`Avg high-recovery: ${data.stress.avg_recovery_time} min/day`);
        lines.push(`Stressed days: ${data.stress.stressed_days}`);
        lines.push(`Restored days: ${data.stress.restored_days}`);
        if (data.stress.insights?.length) {
          lines.push(`\nInsights:`);
          for (const i of data.stress.insights) lines.push(`- ${i}`);
        }
        lines.push(`\n${"-".repeat(70)}\n`);

        lines.push(`## 🏋️ WORKOUTS\n`);
        lines.push(`Total workouts: ${data.workouts.total_workouts}`);
        if (data.workouts.top_activities?.length) {
          lines.push(`Top activities:`);
          for (const a of data.workouts.top_activities) lines.push(`- ${a.activity}: ${a.count}`);
        }
        lines.push(`\n${"-".repeat(70)}\n`);

        lines.push(`## 🧾 SUMMARY\n`);
        lines.push(
          `Overall health score: ${data.summary.overall_health_score} ${getRatingEmoji(
            data.summary.overall_health_score
          )}`
        );
        lines.push(
          `Avg sleep/activity/readiness: ${data.summary.key_metrics.avg_sleep_score}/${data.summary.key_metrics.avg_activity_score}/${data.summary.key_metrics.avg_readiness_score}`
        );
        if (data.key_insights?.length) {
          lines.push(`\nKey insights:`);
          for (const k of data.key_insights) lines.push(`- ${k}`);
        }

        if (params.include_recommendations && data.recommendations?.length) {
          lines.push(`\n${"=".repeat(70)}\n`);
          lines.push(`## 🎯 RECOMMENDATIONS\n`);
          for (const r of data.recommendations) {
            lines.push(`### ${r.category} (${r.priority})`);
            lines.push(`- ${r.recommendation}`);
            if (r.rationale) lines.push(`- Rationale: ${r.rationale}`);
            if (r.action_steps?.length) {
              lines.push(`- Action steps:`);
              for (const s of r.action_steps) lines.push(`  - ${s}`);
            }
            lines.push("");
          }
        }

        return lines.join("\n");
      });

      return truncateIfNeeded(formatted.text, formatted.structured);
    },
  },
];

const ALIASES: Record<string, string> = {
  oura_get_heart_rate: "oura_get_heartrate",
  oura_get_workouts: "oura_get_workout",
};

export function resolveToolName(name: string): string {
  return ALIASES[name] ?? name;
}

export function listTools(): ToolListEntry[] {
  return TOOL_DEFS.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: zodToInputSchemaSummary(t.inputSchema),
  }));
}

export async function callTool(
  name: string,
  args: any,
  ctx: { token: string; responseFormatFallback: ResponseFormat; now?: Date; userAgent?: string }
): Promise<ToolResult> {
  const resolved = resolveToolName(name);
  const def = TOOL_DEFS.find((t) => t.name === resolved);
  if (!def) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const parsed = def.inputSchema.safeParse(args ?? {});
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${parsed.error.message}`);
  }

  const now = ctx.now ?? new Date();
  const toolCtx: ToolContext = { token: ctx.token, now, userAgent: ctx.userAgent };

  const result = await def.handler(parsed.data, toolCtx);
  return {
    content: [{ type: "text", text: result.text }],
    structuredContent: { data: result.structured as unknown },
    structuredData: result.structured,
  };
}
