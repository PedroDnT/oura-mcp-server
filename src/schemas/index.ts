/**
 * Zod validation schemas for Oura MCP tools
 */

import { z } from "zod";
import { ENDPOINTS, ResponseFormat } from "../constants.js";

/**
 * Date validation helpers
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?$/;

export const DateString = z
  .string()
  .regex(dateRegex, "Date must be in YYYY-MM-DD format")
  .refine(
    (date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    },
    { message: "Invalid date" }
  );

export const ISODateTime = z
  .string()
  .regex(isoDateTimeRegex, "DateTime must be in ISO 8601 format");

/**
 * Common parameters across tools
 */
const DateRangeBase = z.object({
  start_date: DateString.describe("Start date in YYYY-MM-DD format"),
  end_date: DateString.optional().describe(
    "End date in YYYY-MM-DD format (optional, defaults to start_date)"
  ),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
});

const DateTimeRangeBase = z.object({
  start_datetime: ISODateTime.describe("Start datetime in ISO 8601 format"),
  end_datetime: ISODateTime.optional().describe(
    "End datetime in ISO 8601 format (optional)"
  ),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
});

const PaginationSchema = z.object({
  page_limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Maximum number of pages to fetch"),
  max_records: z
    .number()
    .int()
    .positive()
    .max(50000)
    .optional()
    .describe("Maximum number of records to return"),
});

export const DateRangeSchema = DateRangeBase.strict();
export const DateRangeWithPaginationSchema = DateRangeBase.extend({
  page_limit: PaginationSchema.shape.page_limit,
  max_records: PaginationSchema.shape.max_records,
}).strict();

export const DateTimeRangeSchema = DateTimeRangeBase.strict();
export const DateTimeRangeWithPaginationSchema = DateTimeRangeBase.extend({
  page_limit: PaginationSchema.shape.page_limit,
  max_records: PaginationSchema.shape.max_records,
}).strict();

const EndpointEnum = z.enum(Object.values(ENDPOINTS) as [string, ...string[]]);

export const RawEndpointSchema = z
  .object({
    endpoint: EndpointEnum.describe("Oura API endpoint (v2 usercollection)"),
    params: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Query parameters for the endpoint"),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
    page_limit: PaginationSchema.shape.page_limit,
    max_records: PaginationSchema.shape.max_records,
  })
  .strict();

export const DashboardsSchema = z
  .object({
    start_date: DateString.describe("Start date for dashboard analysis (YYYY-MM-DD)"),
    end_date: DateString.describe("End date for dashboard analysis (YYYY-MM-DD)"),
    correlation_method: z
      .enum(["spearman", "pearson"])
      .default("spearman")
      .describe("Correlation method to use"),
    max_lag_days: z
      .number()
      .int()
      .min(0)
      .max(30)
      .default(7)
      .describe("Maximum lag (days) to test for lag correlations"),
    response_format: z
      .nativeEnum(ResponseFormat)
      .default(ResponseFormat.MARKDOWN)
      .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
  })
  .strict();

/**
 * Analysis schema for comprehensive health insights
 */
export const AnalysisSchema = z.object({
  start_date: DateString.describe("Start date for analysis period (YYYY-MM-DD)"),
  end_date: DateString.describe("End date for analysis period (YYYY-MM-DD)"),
  include_recommendations: z
    .boolean()
    .default(true)
    .describe("Include personalized health recommendations"),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
}).strict();

export type DateRangeParams = z.infer<typeof DateRangeSchema>;
export type DateRangeWithPaginationParams = z.infer<typeof DateRangeWithPaginationSchema>;
export type DateTimeRangeParams = z.infer<typeof DateTimeRangeSchema>;
export type DateTimeRangeWithPaginationParams = z.infer<typeof DateTimeRangeWithPaginationSchema>;
export type AnalysisParams = z.infer<typeof AnalysisSchema>;
export type RawEndpointParams = z.infer<typeof RawEndpointSchema>;
export type DashboardsParams = z.infer<typeof DashboardsSchema>;
