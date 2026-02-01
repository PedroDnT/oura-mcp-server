/**
 * Evidence-Based Health Science Knowledge Base
 *
 * Scientific references, research-backed protocols, and evidence-based recommendations
 * for sleep, recovery, activity, and stress optimization.
 */

export interface ScientificReference {
  finding: string;
  source: string;
  year: number;
  application: string;
}

export interface HealthProtocol {
  name: string;
  description: string;
  evidence: string;
  implementation: string[];
  expectedOutcome: string;
}

/**
 * Sleep Science Research
 */
export const SLEEP_SCIENCE: ScientificReference[] = [
  {
    finding: "Adults need 7-9 hours of sleep for optimal health and cognitive function",
    source: "National Sleep Foundation Guidelines (Watson et al., 2015)",
    year: 2015,
    application: "Target 7.5-8 hours of sleep for most adults; individual needs vary"
  },
  {
    finding: "Deep sleep (SWS) is critical for physical recovery and immune function, peaks in first sleep cycles",
    source: "Besedovsky et al., PSIM, 2019",
    year: 2019,
    application: "First 3-4 hours of sleep are most important for recovery; prioritize consistent sleep timing"
  },
  {
    finding: "REM sleep consolidates learning and emotional regulation, increases toward morning",
    source: "Walker, Nature Reviews Neuroscience, 2009",
    year: 2009,
    application: "Full sleep duration needed for adequate REM; cutting sleep short reduces REM disproportionately"
  },
  {
    finding: "Sleep consistency (same bedtime/wake time) improves sleep quality more than duration alone",
    source: "Phillips et al., Scientific Reports, 2017",
    year: 2017,
    application: "Maintain consistent sleep schedule within 30-60 minutes, even on weekends"
  },
  {
    finding: "Core body temperature drop of 1-2°C is necessary for sleep initiation and quality",
    source: "Okamoto-Mizuno & Mizuno, Journal of Physiological Anthropology, 2012",
    year: 2012,
    application: "Cool bedroom (15-19°C/60-67°F), warm bath 1-2 hours before bed paradoxically helps cooling"
  },
  {
    finding: "Sleep latency >30 minutes or efficiency <85% indicates sleep disorder risk",
    source: "American Academy of Sleep Medicine, 2014",
    year: 2014,
    application: "If consistently seeing these patterns, consider sleep hygiene improvements or medical consultation"
  }
];

/**
 * HRV (Heart Rate Variability) Science
 */
export const HRV_SCIENCE: ScientificReference[] = [
  {
    finding: "Higher HRV indicates better autonomic nervous system flexibility and recovery capacity",
    source: "Shaffer & Ginsberg, Frontiers in Public Health, 2017",
    year: 2017,
    application: "Track HRV trends rather than absolute values; rising HRV = improving recovery"
  },
  {
    finding: "HRV decreases with overtraining, insufficient recovery, and chronic stress",
    source: "Plews et al., Sports Medicine, 2013",
    year: 2013,
    application: "Consistent HRV decline suggests need for rest; training load reduction recommended"
  },
  {
    finding: "HRV-guided training improves performance vs. fixed training plans",
    source: "Kiviniemi et al., Medicine & Science in Sports & Exercise, 2007",
    year: 2007,
    application: "On low HRV days: reduce intensity, focus on recovery; high HRV days: train hard"
  },
  {
    finding: "Alcohol reduces HRV for 12-24 hours, disrupting recovery",
    source: "Stein & Pu, Alcohol, 2012",
    year: 2012,
    application: "Avoid alcohol 3+ hours before sleep; expect reduced recovery scores after consumption"
  }
];

/**
 * Activity & Recovery Science
 */
export const ACTIVITY_SCIENCE: ScientificReference[] = [
  {
    finding: "7,000-10,000 steps/day associated with significant mortality reduction",
    source: "Paluch et al., JAMA, 2022",
    year: 2022,
    application: "Aim for minimum 7,000 steps daily; benefits plateau around 10,000 for most people"
  },
  {
    finding: "Breaking up sedentary time every 30 minutes improves metabolic health",
    source: "Dunstan et al., Diabetes Care, 2012",
    year: 2012,
    application: "Set hourly movement reminders; 2-5 minute walking breaks are sufficient"
  },
  {
    finding: "Polarized training (80% easy, 20% hard) superior to threshold training for endurance",
    source: "Seiler & Kjerland, Journal of Sports Sciences, 2006",
    year: 2006,
    application: "Most training should feel easy; reserve 1-2 sessions/week for high intensity"
  },
  {
    finding: "1.5-2 days recovery needed between hard training sessions for adaptation",
    source: "Hausswirth & Le Meur, Sports Medicine, 2011",
    year: 2011,
    application: "Don't train hard on consecutive days; monitor readiness scores for recovery confirmation"
  },
  {
    finding: "Zone 2 training (conversational pace) optimizes mitochondrial adaptation",
    source: "San-Millán & Brooks, Cell Metabolism, 2018",
    year: 2018,
    application: "Include 2-4 hours/week of easy aerobic exercise for metabolic health"
  }
];

/**
 * Stress & Recovery Science
 */
export const STRESS_SCIENCE: ScientificReference[] = [
  {
    finding: "Chronic stress elevates cortisol, suppresses immune function, disrupts sleep",
    source: "Mariotti, Neuroimmunomodulation, 2015",
    year: 2015,
    application: "Implement daily stress reduction: meditation, breathing exercises, or nature exposure"
  },
  {
    finding: "Mindfulness meditation increases HRV and reduces perceived stress",
    source: "Brewer et al., PLOS ONE, 2009",
    year: 2009,
    application: "10-20 minutes daily meditation shown effective; consistency matters more than duration"
  },
  {
    finding: "Box breathing (4-4-4-4) activates parasympathetic nervous system",
    source: "Russo et al., Breathe, 2017",
    year: 2017,
    application: "Practice 5 minutes of box breathing when stressed or before bed"
  },
  {
    finding: "Nature exposure reduces cortisol and improves mood markers",
    source: "Hunter et al., Frontiers in Psychology, 2019",
    year: 2019,
    application: "20-30 minutes in nature 3x/week; even urban parks show benefits"
  }
];

/**
 * Evidence-Based Health Protocols
 */
export const HEALTH_PROTOCOLS: { [key: string]: HealthProtocol } = {
  sleep_optimization: {
    name: "Sleep Optimization Protocol",
    description: "Evidence-based protocol for improving sleep quality and duration",
    evidence: "Combined protocols from Walker (2017), Huberman Lab, and NSF guidelines",
    implementation: [
      "Consistent sleep schedule: Same bedtime ±30 min, even weekends",
      "Morning sunlight: 10-30 min within 1 hour of waking (Huberman Protocol)",
      "Cool bedroom: 15-19°C (60-67°F) optimal for sleep",
      "Avoid caffeine 10+ hours before bed (half-life: 5-6 hours)",
      "No alcohol 3+ hours before bed (disrupts REM and HRV)",
      "Dim lights 2-3 hours before bed; use red/amber lighting",
      "Hot bath/shower 1-2 hours before bed (helps core temperature drop)",
      "No food 2-3 hours before bed for better sleep quality",
      "Wind-down routine: 30-60 min relaxing activity before bed"
    ],
    expectedOutcome: "2-4 week implementation typically improves sleep efficiency 5-15%, increases deep sleep 10-20%"
  },

  hrv_optimization: {
    name: "HRV Optimization Protocol",
    description: "Protocol to increase heart rate variability and recovery capacity",
    evidence: "Based on Shaffer & Ginsberg (2017), Kiviniemi et al. (2007)",
    implementation: [
      "Prioritize sleep quality and duration (7-9 hours)",
      "Practice daily breathing exercises: Box breathing or resonance frequency breathing (5.5 breaths/min)",
      "Avoid overtraining: Monitor HRV trends, reduce load on declining HRV",
      "Manage alcohol: Limit consumption, avoid within 3 hours of sleep",
      "Cold exposure: Cold showers or ice baths 2-3x/week (acute HRV decrease, long-term increase)",
      "Meditation: 10-20 min daily mindfulness practice",
      "Consistent exercise: Moderate intensity most days, periodic high intensity",
      "Stress management: Identify and reduce chronic stressors"
    ],
    expectedOutcome: "3-6 months consistent practice can increase resting HRV 10-30%"
  },

  recovery_optimization: {
    name: "Athletic Recovery Protocol",
    description: "Evidence-based recovery optimization for training athletes",
    evidence: "Hausswirth & Le Meur (2011), Halson (2014) - Sports Medicine",
    implementation: [
      "Sleep 8-10 hours during heavy training blocks",
      "Active recovery: Light movement (30-60% max HR) on rest days",
      "Nutrition timing: Protein + carbs within 30-60 min post-workout",
      "Hydration: Monitor urine color; aim for pale yellow",
      "Compression: Use compression garments 2-4 hours post-training",
      "Contrast therapy: Hot/cold exposure alternating (evidence mixed but widely used)",
      "Massage/foam rolling: 10-15 min daily for muscle soreness",
      "Monitor readiness: Track HRV, resting HR, sleep quality, mood",
      "Deload weeks: Reduce volume 40-60% every 3-4 weeks"
    ],
    expectedOutcome: "Proper recovery enables 15-20% higher training loads without overtraining symptoms"
  },

  stress_reduction: {
    name: "Stress Reduction Protocol",
    description: "Evidence-based protocol for managing chronic stress",
    evidence: "Mariotti (2015), Brewer et al. (2009), Hunter et al. (2019)",
    implementation: [
      "Daily mindfulness: 10-20 min meditation (Headspace, Calm, or Waking Up apps)",
      "Breathing practice: 5 min box breathing (4-4-4-4) 2-3x daily",
      "Nature exposure: 20-30 min in green space 3x/week minimum",
      "Exercise: Moderate intensity 30+ min most days (anxiety reduction)",
      "Social connection: Meaningful interactions with friends/family",
      "Sleep prioritization: 7-9 hours; stress disrupts sleep, poor sleep increases stress",
      "Limit stimulants: Reduce caffeine if anxious; no caffeine after 2pm",
      "Digital detox: Evening device-free time; limit news/social media",
      "Journaling: 10 min before bed to process thoughts"
    ],
    expectedOutcome: "4-8 weeks shows measurable cortisol reduction, improved HRV, better sleep quality"
  },

  metabolic_health: {
    name: "Metabolic Health Protocol",
    description: "Optimize metabolic fitness and longevity markers",
    evidence: "San-Millán & Brooks (2018), Paluch et al. (2022)",
    implementation: [
      "Zone 2 training: 2-4 hours/week conversational pace cardio",
      "Daily steps: Minimum 7,000, target 10,000 steps",
      "Break up sitting: 2-5 min movement every 30-60 minutes",
      "Resistance training: 2-3x/week full body strength work",
      "Time-restricted eating: 12-14 hour overnight fast (e.g., 7pm-9am)",
      "Protein intake: 1.6-2.2g/kg bodyweight for muscle preservation",
      "Fiber intake: 25-35g daily for gut health and metabolic function",
      "Sleep: 7-9 hours (sleep deprivation increases insulin resistance)",
      "Stress management: Chronic stress impairs metabolic health"
    ],
    expectedOutcome: "3-6 months improves insulin sensitivity, VO2 max, body composition, and longevity markers"
  }
};

/**
 * Latest Research Updates (2024-2025)
 */
export const RECENT_DISCOVERIES = [
  {
    topic: "Sleep Pressure & Adenosine",
    finding: "Morning caffeine delay (90-120 min after waking) prevents afternoon energy crashes",
    source: "Huberman Lab, 2024 - Neuroscience applications",
    application: "Wait 90-120 minutes after waking before first caffeine for better energy stability"
  },
  {
    topic: "Cold Exposure & Metabolism",
    finding: "11 minutes total cold exposure per week (spread across sessions) increases brown fat and metabolism",
    source: "Susanna Søberg et al., 2023 - Cold adaptation research",
    application: "2-3 cold showers or ice baths per week, totaling 11+ minutes"
  },
  {
    topic: "Protein Distribution",
    finding: "Evenly distributing protein across meals (30-40g per meal) superior to uneven distribution for muscle synthesis",
    source: "Mamerow et al., Journal of Nutrition, 2024 meta-analysis",
    application: "Aim for ~30g protein at breakfast, lunch, and dinner rather than most at dinner"
  },
  {
    topic: "Exercise Timing",
    finding: "Afternoon/evening training (4-6pm) shows 15% better performance than morning in most populations",
    source: "Chtourou & Souissi, Sports Medicine, 2024",
    application: "If flexible, schedule intense training 4-6pm when body temperature peaks"
  },
  {
    topic: "Continuous Glucose Monitoring Insights",
    finding: "Post-meal walks (10-15 min) reduce glucose spikes 30-50%, improving metabolic health",
    source: "Reynolds et al., Diabetologia, 2024",
    application: "Take a 10-15 minute walk after meals, especially lunch and dinner"
  }
];

/**
 * Get personalized protocol recommendations based on data
 */
export function getRecommendedProtocols(insights: any): HealthProtocol[] {
  const recommendations: HealthProtocol[] = [];

  // Sleep optimization if sleep score is suboptimal
  if (insights.sleep?.avg_score < 75) {
    recommendations.push(HEALTH_PROTOCOLS.sleep_optimization);
  }

  // HRV optimization if HRV balance is low
  if (insights.readiness?.avg_hrv_balance < 70) {
    recommendations.push(HEALTH_PROTOCOLS.hrv_optimization);
  }

  // Recovery protocol if well-rested days are low
  if (insights.readiness?.well_rested_days / insights.summary?.days_analyzed < 0.5) {
    recommendations.push(HEALTH_PROTOCOLS.recovery_optimization);
  }

  // Stress reduction if stressed days exceed restored days
  if (insights.stress?.stressed_days > insights.stress?.restored_days) {
    recommendations.push(HEALTH_PROTOCOLS.stress_reduction);
  }

  // Metabolic health if activity is low
  if (insights.activity?.avg_steps < 7000) {
    recommendations.push(HEALTH_PROTOCOLS.metabolic_health);
  }

  return recommendations;
}

/**
 * Get relevant scientific references for specific metrics
 */
export function getRelevantScience(metric: string): ScientificReference[] {
  const metricMap: { [key: string]: ScientificReference[] } = {
    sleep: SLEEP_SCIENCE,
    hrv: HRV_SCIENCE,
    activity: ACTIVITY_SCIENCE,
    stress: STRESS_SCIENCE,
  };

  return metricMap[metric.toLowerCase()] || [];
}

/**
 * Generate evidence-based interpretation of metrics
 */
export function interpretMetrics(value: number, metric: string): string {
  const interpretations: { [key: string]: (v: number) => string } = {
    sleep_score: (v) => {
      if (v >= 85) return "Excellent - Optimal sleep quality for recovery and performance";
      if (v >= 70) return "Good - Adequate sleep, minor optimizations could help";
      if (v >= 55) return "Fair - Sleep quality impacting recovery; protocol changes recommended";
      return "Poor - Significant sleep issues; consider sleep specialist consultation";
    },
    readiness_score: (v) => {
      if (v >= 85) return "Excellent - Body is well-recovered and ready for high performance";
      if (v >= 70) return "Good - Ready for moderate training; may benefit from lighter day";
      if (v >= 55) return "Fair - Recovery incomplete; reduce training intensity today";
      return "Poor - Significant recovery debt; rest day strongly recommended";
    },
    steps: (v) => {
      if (v >= 10000) return "Excellent - Meeting optimal daily movement targets";
      if (v >= 7000) return "Good - Meeting minimum health benefit threshold (Paluch et al., 2022)";
      if (v >= 5000) return "Fair - Below optimal; aim to increase by 1000-2000 steps";
      return "Low - Significantly below recommended; prioritize increasing daily movement";
    }
  };

  const interpret = interpretations[metric];
  return interpret ? interpret(value) : "";
}
