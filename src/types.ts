/**
 * TypeScript interfaces for Oura API v2 data structures
 */

export interface HeartRateSample {
  bpm: number;
  source: string;
  timestamp: string; // ISO 8601
}

export interface HeartRateResponse {
  data: HeartRateSample[];
  next_token: string | null;
}

export interface SleepResponse {
  data: Sleep[];
  next_token: string | null;
}

export interface Sleep {
  id: string;
  day: string; // YYYY-MM-DD
  bedtime_start: string; // ISO 8601
  bedtime_end: string; // ISO 8601
  type: "long_sleep" | "short_sleep" | "rest";

  // Time-series data (5-minute intervals)
  heart_rate?: {
    interval: number; // 300 seconds (5 min)
    items: number[];
    timestamp: string;
  };
  hrv?: {
    interval: number; // 300 seconds
    items: number[];
    timestamp: string;
  };
  movement_30_sec?: string; // 30-second movement data
  sleep_phase_5_min?: string; // Sleep stages at 5-min intervals

  // Summary metrics
  total_sleep_duration: number;
  deep_sleep_duration: number;
  light_sleep_duration: number;
  rem_sleep_duration: number;
  awake_time: number;
  efficiency: number;
  latency: number;
  restless_periods: number;
  average_heart_rate: number;
  lowest_heart_rate: number;
  average_hrv: number;
  temperature_delta: number;
  temperature_deviation: number;
  respiratory_rate: number;
}

export interface DailySleep {
  id: string;
  day: string;
  score: number;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
  timestamp: string;
}

export interface DailyActivity {
  id: string;
  class_5_min: string;
  day: string;
  score: number;
  active_calories: number;
  average_met_minutes: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;
  medium_activity_met_minutes: number;
  medium_activity_time: number;
  met: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  meters_to_target: number;
  non_wear_time: number;
  resting_time: number;
  sedentary_met_minutes: number;
  sedentary_time: number;
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
  timestamp: string;
}

export interface DailyReadiness {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
  timestamp: string;
}

export interface DailyResilience {
  id: string;
  day: string;
  level: "limited" | "adequate" | "solid" | "strong" | "exceptional";
  contributors: {
    daytime_recovery: number;
    sleep_recovery: number;
    stress: number;
  };
  timestamp: string;
}

export interface DailyStress {
  id: string;
  day: string;
  day_summary: "restored" | "normal" | "stressed" | null;
  stress_high: number;
  recovery_high: number;
  day_summary_values: {
    stress_high_time: number;
    recovery_high_time: number;
    day_summary_metric: number;
  } | null;
  timestamp: string;
}

export interface DailySpo2 {
  id: string;
  day: string;
  spo2_percentage: {
    average: number;
  };
  breathing_disturbance_index: number | null;
  timestamp: string;
}

export interface DailyCardiovascularAge {
  id: string;
  day: string;
  cardiovascular_age: number;
  timestamp: string;
  [key: string]: unknown;
}

export interface Workout {
  id: string;
  activity: string;
  calories: number;
  day: string;
  distance: number;
  end_datetime: string;
  intensity: "easy" | "moderate" | "hard";
  label: string | null;
  source: string;
  start_datetime: string;

  // Granular heart rate zones
  heart_rate: {
    interval: number;
    items: number[];
    timestamp: string;
  } | null;
}

export interface VO2Max {
  id: string;
  day: string;
  vo2_max: number;
  timestamp: string;
}

export interface SleepTime {
  id: string;
  day: string;
  bedtime_start: string;
  bedtime_end: string;
  total_sleep_duration?: number;
  time_in_bed?: number;
  efficiency?: number;
  [key: string]: unknown;
}

export interface EnhancedTag {
  id: string;
  tag_type_code: string;
  start_time: string;
  end_time: string;
  start_day: string;
  end_day: string;
  comment: string | null;
  timestamp: string;
}

export interface Tag {
  id: string;
  tag_type_code?: string;
  start_time?: string;
  end_time?: string;
  day?: string;
  comment?: string | null;
  timestamp?: string;
  [key: string]: unknown;
}

export interface RestModePeriod {
  id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  timestamp?: string;
  [key: string]: unknown;
}

export interface PersonalInfo {
  id: string;
  age: number;
  weight: number;
  height: number;
  biological_sex: "male" | "female";
  email: string;
}

export interface RingConfiguration {
  id: string;
  color: string;
  design: string;
  firmware_version: string;
  hardware_type: string;
  set_up_at: string;
}

export interface Session {
  id: string;
  day?: string;
  start_datetime?: string;
  end_datetime?: string;
  type?: string;
  mood?: string | null;
  [key: string]: unknown;
}
