/**
 * Oura MCP Server Constants
 */

export const OURA_API_BASE_URL = "https://api.ouraring.com/v2/usercollection";
export const CHARACTER_LIMIT = 50000; // Increased for granular time-series data
export const DEFAULT_PAGE_SIZE = 30; // Days of data per request

/**
 * Oura API endpoint paths
 */
export const ENDPOINTS = {
  // Time-series data (most granular)
  HEARTRATE: "heartrate",
  SLEEP: "sleep",

  // Daily summaries
  DAILY_SLEEP: "daily_sleep",
  DAILY_ACTIVITY: "daily_activity",
  DAILY_READINESS: "daily_readiness",
  DAILY_RESILIENCE: "daily_resilience",
  DAILY_STRESS: "daily_stress",
  DAILY_SPO2: "daily_spo2",
  DAILY_CARDIOVASCULAR_AGE: "daily_cardiovascular_age",

  // Workouts and sessions
  WORKOUT: "workout",
  SESSION: "session",

  // Health metrics
  VO2_MAX: "vO2_max",
  SLEEP_TIME: "sleep_time",

  // Tags and user data
  ENHANCED_TAG: "enhanced_tag",
  TAG: "tag",
  REST_MODE_PERIOD: "rest_mode_period",
  PERSONAL_INFO: "personal_info",
  RING_CONFIGURATION: "ring_configuration"
} as const;

/**
 * Response format options
 */
export enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}
