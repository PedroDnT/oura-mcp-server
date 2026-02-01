# Oura MCP Server - Complete Setup Guide

This guide will walk you through setting up your Oura MCP server from scratch.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 18+** installed ([Download](https://nodejs.org/))
- [ ] **Oura Ring** (Gen 2, Gen 3, or Gen 4)
- [ ] **Active Oura Membership**
- [ ] **Claude Desktop** installed
- [ ] **Oura OAuth credentials** (Client ID and Secret)

---

## 🔐 Step 1: Get OAuth Credentials

### You Already Have Credentials!

You've already created an OAuth application with these credentials:

```
Client ID: a19495aa-9d93-46c3-829b-63ab4d1dfaeb
Client Secret: etJFzARKoCR4TX2xnY3JCElvaLB_oUSWJM2ycL3aiPs
```

### Generate Access Token

Since this MCP server requires a **Bearer token** for authentication, you need to complete the OAuth flow to get an access token.

**Temporary Solution (for testing):**

For now, you can use a **Personal Access Token**:

1. Go to https://cloud.ouraring.com/v2/docs
2. Scroll down to the "Authentication" section
3. Click "Generate Personal Access Token"
4. Copy the token (it will look like: `ABCDEF123456...`)
5. **Save it securely** - you'll need it for configuration

**Note:** Personal Access Tokens are being deprecated. For production use, implement a full OAuth 2.0 flow.

---

## 📦 Step 2: Install the MCP Server

### Option A: From Your OURA Folder

The server is already built in your OURA folder:

```bash
cd /path/to/OURA/oura-mcp-server

# Install dependencies (if not already done)
npm install

# Build the server
npm run build
```

### Option B: Fresh Installation

```bash
# Create new directory
mkdir ~/oura-mcp-server
cd ~/oura-mcp-server

# Copy all files from the built server
# (or clone from repository if published)

# Install and build
npm install
npm run build
```

### Verify Installation

```bash
# Check that dist/index.js was created
ls dist/index.js

# Should output: dist/index.js
```

---

## ⚙️ Step 3: Configure Claude Desktop

### Find Your Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### Edit Configuration

Open the config file and add the Oura MCP server:

```json
{
  "mcpServers": {
    "oura": {
      "command": "node",
      "args": [
        "/Users/YOURUSERNAME/path/to/oura-mcp-server/dist/index.js"
      ],
      "env": {
        "OURA_ACCESS_TOKEN": "YOUR_PERSONAL_ACCESS_TOKEN_HERE"
      }
    }
  }
}
```

**Important replacements:**
1. Replace `/Users/YOURUSERNAME/path/to/oura-mcp-server` with the **actual absolute path** to your oura-mcp-server directory
2. Replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual Oura access token

### Example Configuration

```json
{
  "mcpServers": {
    "oura": {
      "command": "node",
      "args": [
        "/Users/pedro/OURA/oura-mcp-server/dist/index.js"
      ],
      "env": {
        "OURA_ACCESS_TOKEN": "ABCDEF1234567890EXAMPLE"
      }
    }
  }
}
```

---

## 🚀 Step 4: Start Using the MCP Server

### 1. Restart Claude Desktop

**Completely quit and restart** Claude Desktop for the configuration to take effect.

### 2. Verify Connection

In Claude Desktop, try:

```
What Oura tools are available?
```

You should see 9 tools listed, including:
- `oura_get_heartrate`
- `oura_get_sleep_detailed`
- `oura_analyze_health_trends`
- And 6 more...

### 3. Test Data Retrieval

Try a simple query:

```
Show my personal Oura information
```

If successful, you should see your age, weight, height, and ring details!

### 4. Try Advanced Analysis

```
Analyze my health trends for the past month and give me personalized recommendations
```

This will fetch all your data and generate comprehensive insights!

---

## 🎯 Example Queries to Try

### Basic Data Retrieval
```
Show my sleep scores for the past week

Get my activity data for January

What was my readiness yesterday?
```

### Detailed Analysis
```
Show detailed sleep data with HRV for last night

Get heart rate at 5-minute intervals for today

Analyze my workout sessions from this month
```

### Comprehensive Insights (The Best Part!)
```
Generate a comprehensive health report for the past 30 days

What patterns do you see in my sleep and recovery?

Analyze my health trends and tell me what to improve

Show correlations between my stress levels and sleep quality
```

---

## 🐛 Troubleshooting

### Problem: "OURA_ACCESS_TOKEN environment variable is required"

**Solution:** Your access token is missing or incorrect in the config file.
1. Check that you've added the token in `claude_desktop_config.json`
2. Ensure the token is a valid Oura Personal Access Token
3. Restart Claude Desktop after changing the config

### Problem: "Authentication failed: Invalid or expired access token"

**Solution:** Your access token has expired or is invalid.
1. Generate a new Personal Access Token from https://cloud.ouraring.com/v2/docs
2. Update the token in `claude_desktop_config.json`
3. Restart Claude Desktop

### Problem: "Permission denied: You don't have access to this data"

**Solution:** Your Oura membership may be inactive.
1. Check your Oura subscription status at https://ouraring.com/
2. Ensure your membership is active
3. Gen 3 and Ring 4 users require an active membership for API access

### Problem: "No tools are showing up in Claude"

**Solution:** MCP server isn't loading.
1. Verify the path in `claude_desktop_config.json` is correct and absolute
2. Check that `dist/index.js` exists in the oura-mcp-server directory
3. Look for errors in Claude Desktop's logs:
   - macOS: `~/Library/Logs/Claude/mcp*.log`
   - Windows: `%APPDATA%\Claude\logs\mcp*.log`
4. Ensure Node.js 18+ is installed: `node --version`

### Problem: "Rate limit exceeded"

**Solution:** You've hit Oura's 5,000 requests/day limit.
1. Wait 24 hours for the limit to reset
2. Use smaller date ranges in your queries
3. Be selective about which data you fetch

---

## 🔒 Security Best Practices

1. **Never share your access token** - It provides full access to your Oura data
2. **Use environment variables** - Don't hardcode tokens in scripts
3. **Rotate tokens regularly** - Generate new tokens periodically
4. **Use OAuth in production** - Personal Access Tokens are being deprecated

---

## 📊 Understanding the Data

### Data Freshness
- Oura syncs data when you open the Oura app
- MCP server fetches real-time data from Oura's servers
- Most recent data may have a 1-2 hour delay

### Data Availability
- **Sleep data:** Available morning after sleep session
- **Activity data:** Updated throughout the day
- **Readiness:** Calculated in the morning
- **Heart rate:** Continuous 5-minute intervals
- **Workouts:** Available after workout completion

---

## 🎓 Next Steps

Now that your MCP server is set up:

1. **Explore your data** - Try different date ranges and metrics
2. **Generate insights** - Use the analysis tool monthly for health reviews
3. **Track trends** - Ask about correlations and patterns
4. **Optimize health** - Follow the personalized recommendations
5. **Research questions** - Use the granular data for deep analysis

---

## 📞 Getting Help

If you encounter issues:

1. **Check the logs** - Look in Claude Desktop logs for error messages
2. **Verify credentials** - Ensure your access token is valid
3. **Test API directly** - Try accessing Oura API at https://cloud.ouraring.com/v2/docs
4. **Review documentation** - See README.md for detailed tool descriptions

---

## ✅ Setup Complete!

You're all set! Your Oura MCP server is now integrated with Claude Desktop, giving you:

- ✅ Access to all granular Oura health data
- ✅ 5-minute heart rate and HRV intervals
- ✅ Detailed sleep analysis with hypnograms
- ✅ Comprehensive health insights and trends
- ✅ **Personalized recommendations** for improvement

**Start exploring your health data and optimizing your wellness! 🚀💪📊**
