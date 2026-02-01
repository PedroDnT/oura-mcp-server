/**
 * Zod validation schemas for Oura MCP tools
 */

import { z } from "zod";
import { ResponseFormat } from "../constants.js";

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
export const DateRangeSchema = z.object({
  start_date: DateString.describe("Start date in YYYY-MM-DD format"),
  end_date: DateString.optional().describe(
    "End date in YYYY-MM-DD format (optional, defaults to start_date)"
  ),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
}).strict();

export const DateTimeRangeSchema = z.object({
  start_datetime: ISODateTime.describe("Start datetime in ISO 8601 format"),
  end_datetime: ISODateTime.optional().describe(
    "End datetime in ISO 8601 format (optional)"
  ),
  response_format: z
    .nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data"),
}).strict();

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
export type DateTimeRangeParams = z.infer<typeof DateTimeRangeSchema>;
export type AnalysisParams = z.infer<typeof AnalysisSchema>;
