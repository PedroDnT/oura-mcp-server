# Oura MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.6-green.svg)](https://modelcontextprotocol.io/)
[![Oura API](https://img.shields.io/badge/Oura%20API-v2-orange.svg)](https://cloud.ouraring.com/v2/docs)

**Comprehensive Model Context Protocol (MCP) server for Oura Ring API v2 with maximum data granularity.**

Access all your Oura health data with the highest level of detail available:
- ⌚ Heart rate at 5-minute intervals
- 😴 Detailed sleep data with HRV, movement, and hypnograms
- 🏃 Complete activity, workout, and recovery metrics
- 📊 Comprehensive health insights and trend analysis
- 🧪 Science dashboards with correlations, lag effects, and derived features
- 🎯 Personalized recommendations for health optimization

---

## ✨ Features

### 🔬 Maximum Granularity Data Access

**Time-Series Biometrics:**
- Heart rate measurements every 5 minutes
- HRV (Heart Rate Variability) at 5-minute intervals during sleep
- Movement data at 30-second intervals
- Sleep stage hypnogram (Deep/Light/REM/Awake) at 5-minute resolution

**Comprehensive Health Metrics:**
- Daily sleep scores and quality breakdown
- Activity tracking with steps, calories, and MET minutes
- Readiness scores with recovery indicators
- Stress and resilience metrics
- SPO2 (blood oxygen) measurements
- VO2 max and cardiovascular age
- Workout sessions with heart rate zones

### 🧠 AI-Powered Health Insights

**Automated Analysis Tool:**
- Sleep quality trends and pattern detection
- Activity-recovery balance analysis
- Stress level correlations
- Anomaly detection and health alerts
- **Personalized recommendations** for improving:
  - Sleep quality and duration
  - Recovery and readiness
  - Activity levels and training load
- Stress management

### 🧪 Science Dashboards

**Dashboards in the web UI:**
- Correlation heatmaps + drilldown scatter plots
- Lag effects (e.g., activity → next-day readiness)
- Bedtime consistency distribution + sleep score impact
- Stress vs sleep efficiency coupling
- SpO2/breathing disturbance vs recovery

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- Oura Ring (Gen 2, Gen 3, or Gen 4)
- Active Oura membership
- Oura OAuth access token

### Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

4. **Get your Oura OAuth access token:**
   - Go to https://cloud.ouraring.com/oauth/applications
   - Create a new OAuth application
   - Note your Client ID and Client Secret (do not commit them)
   - Use either:
     - An OAuth access token (recommended), or
     - A Personal Access Token (PAT) for quick testing (Oura may deprecate PATs)

### Integration with Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "oura": {
      "command": "node",
      "args": [
        "/path/to/oura-mcp-server/dist/index.js"
      ],
      "env": {
        "OURA_ACCESS_TOKEN": "YOUR_OAUTH_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Important:** Replace `/path/to/oura-mcp-server` with the actual path and add your OAuth access token.

---

## 🌐 Web UI + HTTP (Vercel / multi-user)

This project also supports a Vercel-deployable web UI and HTTP APIs:

- `GET /` — web UI (paste token, run tools, charts + tables, download JSON)
- `GET /oauth/start` — OAuth login (redirects to Oura)
- `GET /oauth/callback` — OAuth callback (sets encrypted HttpOnly session cookie)
- `POST /api/tools/call` — call a tool (cookie session or Authorization header)
- `POST /mcp` — JSON-RPC (`initialize`, `tools/list`, `tools/call`)

### Required environment variables (HTTP / multi-user)

- `SESSION_SECRET` — required to encrypt the HttpOnly cookie session (32+ bytes recommended)

### OAuth login (recommended for maximum user integration)

Instead of manually pasting a token, you can enable OAuth 2.0 authorization-code login:

1. Create an OAuth application in the Oura Cloud dashboard.
2. Configure the Redirect URI to point to your deployed server:
   - Example: `https://YOUR_DEPLOYMENT_DOMAIN/oauth/callback`
3. Set these environment variables (locally or on Vercel):
   - `OURA_OAUTH_CLIENT_ID`
   - `OURA_OAUTH_CLIENT_SECRET`
   - `OURA_OAUTH_REDIRECT_URI` (must match your Oura app config exactly)
   - `OURA_OAUTH_SCOPES` (optional; defaults to `daily heartrate personal sleep workout session tag`)

After that, open the web UI and click “Connect with Oura”.

### Token handling

- Browser UI: token stored in an encrypted HttpOnly cookie session.
- Programmatic clients: send `Authorization: Bearer <token>` (overrides cookie).

### Restart Claude Desktop

After updating the config, restart Claude Desktop to load the MCP server.

---

## 🛠️ Available Tools

**Pagination (list endpoints):** Most list tools accept `page_limit` and `max_records`. If `end_date` is omitted, it defaults to `start_date`. If `end_datetime` is omitted, it defaults to “now.”

### 1. `oura_get_heartrate`
**Get heart rate at 5-minute intervals** - Most granular cardiovascular data

**Parameters:**
- `start_datetime` (string): ISO 8601 format (e.g., "2024-01-15T00:00:00Z")
- `end_datetime` (string, optional): ISO 8601 format
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
Show my heart rate for the past 24 hours
```

---

### 2. `oura_get_sleep_detailed`
**Get comprehensive sleep data** - HRV, movement, hypnogram at highest granularity

**Parameters:**
- `start_date` (string): YYYY-MM-DD format
- `end_date` (string, optional): YYYY-MM-DD format
- `response_format` ('markdown' | 'json'): Output format

**Returns:**
- Heart rate at 5-minute intervals during sleep
- HRV at 5-minute intervals
- Movement at 30-second intervals
- Sleep stage hypnogram at 5-minute resolution
- Complete sleep quality metrics

**Example:**
```
Show detailed sleep data for last week with HRV trends
```

---

### 3. `oura_get_daily_sleep`
**Get daily sleep scores** - Sleep quality breakdown

**Parameters:**
- `start_date` (string): YYYY-MM-DD
- `end_date` (string, optional): YYYY-MM-DD
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
What were my sleep scores for the past month?
```

---

### 4. `oura_get_daily_activity`
**Get daily activity metrics** - Steps, calories, MET minutes, activity distribution

**Parameters:**
- `start_date` (string): YYYY-MM-DD
- `end_date` (string, optional): YYYY-MM-DD
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
Show my activity data for January
```

---

### 5. `oura_get_daily_readiness`
**Get readiness scores** - Recovery and preparedness metrics

**Parameters:**
- `start_date` (string): YYYY-MM-DD
- `end_date` (string, optional): YYYY-MM-DD
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
How was my readiness this week?
```

---

### 6. `oura_get_daily_stress`
**Get stress and recovery data** - Daily stress levels and recovery time

**Parameters:**
- `start_date` (string): YYYY-MM-DD
- `end_date` (string, optional): YYYY-MM-DD
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
Analyze my stress patterns for the past 2 weeks
```

---

### 7. `oura_get_workout`
**Get workout sessions** - Detailed workout data with heart rate zones

**Parameters:**
- `start_date` (string): YYYY-MM-DD
- `end_date` (string, optional): YYYY-MM-DD
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
Show all my workouts from last month
```

---

### 8. `oura_get_personal_info`
**Get personal information** - User profile fields (age, sex, height, weight, email)

**Parameters:**
- `response_format` ('markdown' | 'json'): Output format

**Example:**
```
Show my Oura profile information
```

---

### 9. `oura_analyze_health_trends` ⭐
**Generate comprehensive health insights and recommendations**

This is the **flagship analysis tool** that:
- Analyzes all Oura data for a specified period
- Identifies sleep, activity, and recovery trends
- Detects patterns and anomalies
- Generates **personalized health recommendations**
- Provides actionable insights for optimization

**Parameters:**
- `start_date` (string): Analysis period start (YYYY-MM-DD)
- `end_date` (string): Analysis period end (YYYY-MM-DD)
- `include_recommendations` (boolean): Include personalized recommendations (default: true)
- `response_format` ('markdown' | 'json'): Output format

**Example Queries:**
```
Analyze my health trends for the past month and give me recommendations

Generate a comprehensive health report for January with insights on what to improve

What patterns do you see in my sleep, activity, and recovery over the last 30 days?
```

**What You Get:**
- 📊 Sleep quality trends (averages, best/worst nights, trend direction)
- 🏃 Activity patterns (steps, calories, workout frequency)
- 💪 Recovery analysis (readiness scores, well-rested percentage)
- 🧘 Stress balance (stressed vs. restored days)
- 🎯 **Personalized recommendations** prioritized by impact
- 🔍 Key insights and health alerts

---

### 10. `oura_generate_science_dashboards` 🧪
**Generate science dashboards** - Correlations, lag effects, and derived features

**Parameters:**
- `start_date` (string): Analysis period start (YYYY-MM-DD)
- `end_date` (string): Analysis period end (YYYY-MM-DD)
- `correlation_method` ('spearman' | 'pearson'): Default `spearman`
- `max_lag_days` (number): Default 7
- `response_format` ('markdown' | 'json'): Output format

**What You Get:**
- Joined per-day table with derived features (bedtime consistency, stage proportions, training load)
- Correlation matrix + detrended correlation matrix
- Lag analysis (activity/stress/sleep → readiness)
- Dashboard cards with chart-ready data

---

### 11. `oura_get_raw_endpoint`
**Escape hatch** - Fetch raw JSON from any supported Oura v2 endpoint

**Parameters:**
- `endpoint` (string): Oura v2 usercollection endpoint
- `params` (object): Query params
- `page_limit` / `max_records` (optional)
- `response_format` ('markdown' | 'json')

---

### Additional Endpoint Tools
- `oura_get_daily_resilience`
- `oura_get_daily_spo2`
- `oura_get_daily_cardiovascular_age`
- `oura_get_vo2_max`
- `oura_get_sleep_time`
- `oura_get_session`
- `oura_get_enhanced_tag`
- `oura_get_tag`
- `oura_get_rest_mode_period`
- `oura_get_ring_configuration`

## 📖 Example Use Cases

### Research & Analysis
```
Analyze my sleep quality correlation with workout intensity over the past 3 months

Show detailed HRV trends during sleep for January and identify any anomalies

Compare my heart rate variability on rest days vs. workout days
```

### Health Optimization
```
Generate health insights for the past month and tell me what to focus on improving

What's the relationship between my stress levels and sleep quality?

Analyze my recovery patterns and recommend optimal training frequency
```

### Progress Tracking
```
Show my sleep score trend for the past 90 days

Compare my activity levels month-over-month for Q1

Track my VO2 max progression over the year
```

---

## 🔐 Authentication

This MCP server uses **OAuth 2.0** authentication with Oura API v2.

### Getting an Access Token

You have two options:

**Option 1: OAuth Flow (Recommended for production)**
1. Create an OAuth application at https://cloud.ouraring.com/oauth/applications
2. Implement OAuth 2.0 flow to get access token
3. Token refresh is handled automatically

**Option 2: Personal Access Token (Quick start)**
1. Go to https://cloud.ouraring.com/v2/docs
2. Generate a Personal Access Token
3. Use directly in configuration

**Note:** Personal Access Tokens are being deprecated by Oura. OAuth is recommended for long-term use.

---

## 🎯 Data Granularity Levels

| Data Type | Granularity | Tool |
|-----------|------------|------|
| Heart Rate | 5 minutes | `oura_get_heartrate` |
| HRV (during sleep) | 5 minutes | `oura_get_sleep_detailed` |
| Movement (during sleep) | 30 seconds | `oura_get_sleep_detailed` |
| Sleep Stages | 5 minutes | `oura_get_sleep_detailed` |
| Activity Class | 5 minutes | `oura_get_daily_activity` |
| MET Minutes | Per day | `oura_get_daily_activity` |
| Sleep Score | Per day | `oura_get_daily_sleep` |
| Readiness Score | Per day | `oura_get_daily_readiness` |
| Stress Levels | Per day | `oura_get_daily_stress` |

**Granularity limits:** Oura’s public API tops out at 5‑minute heart rate, 5‑minute sleep stages, and 30‑second sleep movement where available. Raw/second‑level streams are not exposed.

---

## 🔧 Development

### Build
```bash
npm run build
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Clean Build
```bash
npm run clean
npm run build
```

---

## 📊 Response Formats

All tools support two response formats:

### Markdown (Default)
Human-readable format with:
- Clear headers and sections
- Formatted tables and lists
- Emojis for quick scanning
- Contextual information

### JSON
Structured data format for:
- Programmatic processing
- Data analysis pipelines
- Integration with other tools
- Custom visualizations

**Specify format:**
```
Show my sleep data for last week in JSON format
```

---

## ⚠️ Rate Limits

Oura API v2 allows **5,000 requests per day**.

The MCP server:
- Returns up to 50,000 characters per response
- Automatically truncates large responses
- Suggests using smaller date ranges if needed
- Respects API rate limits with clear error messages

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional Oura API v2 endpoints
- Enhanced analysis algorithms
- More sophisticated recommendations
- Visualization capabilities
- Testing and documentation

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [Model Context Protocol SDK](https://modelcontextprotocol.io/)
- Powered by [Oura Ring API v2](https://cloud.ouraring.com/v2/docs)
- Created for comprehensive health data research and insights

---

## 📮 Support

- **Oura API Documentation:** https://cloud.ouraring.com/v2/docs
- **MCP Protocol:** https://modelcontextprotocol.io/
- **Issues:** Open an issue in this repository

---

## 🎉 Get Started!

1. Install and configure the MCP server
2. Restart Claude Desktop
3. Start asking questions about your health data:
   - "Analyze my health trends for the past month"
   - "Show detailed sleep data with HRV for last week"
   - "What should I focus on to improve my recovery?"

**Your comprehensive Oura health insights await! 🚀💪📊**
# oura-mcp-server
