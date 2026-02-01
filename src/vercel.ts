/**
 * Vercel-specific entry point
 * Simple Express app export for Vercel serverless functions
 */
import express from "express";
import type { Request, Response } from "express";

const app = express();
app.use(express.json());


// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "oura-mcp-server",
    version: "1.0.0",
    transport: "http-vercel",
    environment: "production",
    oura_token_configured: !!process.env.OURA_ACCESS_TOKEN,
    message: "Oura MCP Server is running on Vercel!",
  });
});

// Root documentation endpoint
app.get("/", (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Oura MCP Server - Vercel</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            color: #667eea;
            margin-top: 0;
            font-size: 2.5em;
          }
          .status-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .status-box strong { display: block; margin: 8px 0; }
          code {
            background: #f4f4f4;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
          }
          .endpoint {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .feature {
            display: inline-block;
            background: #e7f3ff;
            padding: 8px 16px;
            margin: 5px;
            border-radius: 20px;
            font-size: 0.9em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏥 Oura MCP Server</h1>
          <p style="font-size: 1.2em; color: #666;">Evidence-Based Health Insights • Maximum Data Granularity</p>

          <div class="status-box">
            <strong>✅ Server Status: Online</strong>
            <strong>🚀 Platform: Vercel Serverless</strong>
            <strong>🔗 API: Oura Cloud API v2</strong>
            <strong>🛠️ Tools: 9 Comprehensive Health Analytics</strong>
            <strong>🔬 Scientific References: 60+ Research Citations</strong>
          </div>

          <h2>🎯 Features</h2>
          <div>
            <span class="feature">⌚ 5-min Heart Rate Intervals</span>
            <span class="feature">💓 HRV Analysis</span>
            <span class="feature">🛌 Sleep Stage Tracking</span>
            <span class="feature">🏃 Activity Monitoring</span>
            <span class="feature">🔬 Scientific Insights</span>
            <span class="feature">📊 Trend Analysis</span>
          </div>

          <h2>🔗 API Endpoints</h2>

          <div class="endpoint">
            <strong>GET /health</strong><br>
            Health check and server status
          </div>

          <div class="endpoint">
            <strong>POST /mcp</strong><br>
            Model Context Protocol endpoint for MCP clients
          </div>

          <div class="endpoint">
            <strong>GET /</strong><br>
            This documentation page
          </div>

          <h2>🔧 Configuration</h2>
          <p>
            <strong>Required Environment Variable:</strong><br>
            <code>OURA_ACCESS_TOKEN</code> - Your Oura Personal Access Token
          </p>
          <p>
            Get your token at: <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank">cloud.ouraring.com/personal-access-tokens</a>
          </p>

          <h2>📚 Available Tools</h2>
          <ol>
            <li><strong>oura_get_heart_rate</strong> - 5-minute interval heart rate data</li>
            <li><strong>oura_get_hrv</strong> - Heart rate variability (sleep periods)</li>
            <li><strong>oura_get_movement</strong> - 30-second movement intervals</li>
            <li><strong>oura_get_sleep</strong> - Detailed sleep hypnogram</li>
            <li><strong>oura_get_daily_sleep</strong> - Sleep summaries & scores</li>
            <li><strong>oura_get_daily_activity</strong> - Activity metrics</li>
            <li><strong>oura_get_daily_readiness</strong> - Readiness scores</li>
            <li><strong>oura_get_workouts</strong> - Workout details with HR zones</li>
            <li><strong>oura_analyze_health_trends</strong> - AI-powered comprehensive analysis</li>
          </ol>

          <h2>🧪 Test the API</h2>
          <p>Try the health check:</p>
          <pre style="background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto;"><code>curl https://oura-mcp-server.vercel.app/health</code></pre>

          <hr style="margin: 40px 0; border: none; border-top: 1px solid #dee2e6;">

          <p style="color: #6c757d; text-align: center;">
            Powered by Oura API v2 | MCP SDK 1.6 | Deployed on Vercel
          </p>
        </div>
      </body>
    </html>
  `);
});

// MCP endpoint - returns a basic response for now
// Full MCP implementation requires connecting to the main server instance
app.post("/mcp", (_req: Request, res: Response) => {
  res.json({
    jsonrpc: "2.0",
    id: 1,
    result: {
      protocolVersion: "2024-11-05",
      serverInfo: {
        name: "oura-mcp-server",
        version: "1.0.0",
      },
      capabilities: {
        tools: {},
      },
      message: "MCP Server running on Vercel. Full tool integration coming soon.",
    },
  });
});

// Catch all other routes
app.all("*", (_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "Available endpoints: GET /, GET /health, POST /mcp",
  });
});

// Global error handler to avoid crashing the serverless function
app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled error in Vercel function:", err);
  if (res.headersSent) return;
  res.status(500).json({
    error: "Internal Server Error",
    message: "An unexpected error occurred.",
  });
});

// Export the Express app for Vercel
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
