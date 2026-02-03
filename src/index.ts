#!/usr/bin/env node
/**
 * Oura MCP Server (stdio + Vercel-ready HTTP)
 *
 * - Stdio transport: MCP server for Claude Desktop (single-user via OURA_ACCESS_TOKEN env var)
 * - HTTP transport: multi-user web UI + JSON APIs + JSON-RPC (/mcp) with per-request tokens
 *
 * Token handling (HTTP):
 * - Browser UI: encrypted HttpOnly cookie session (requires SESSION_SECRET)
 * - Programmatic: Authorization: Bearer <token> header (overrides cookie)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { type Express } from "express";
import { z } from "zod";
import { ResponseFormat } from "./constants.js";
import { TOOL_DEFS, callTool, listTools } from "./core/tools.js";
import {
  clearSessionCookie,
  getTokenFromRequest,
  getTokenForRequestWithRefresh,
  getSessionInfo,
  setSessionCookie,
} from "./http/session.js";
import { handleJsonRpc } from "./http/jsonRpc.js";
import { getIndexHtml } from "./http/ui.js";
import { oauthCallback, oauthConfigSummary, oauthLogout, oauthStart } from "./http/oauth.js";

const SERVER_INFO = { name: "oura-mcp-server", version: "1.0.0" } as const;

function requireStdioToken(): string {
  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token || token.trim().length === 0) {
    console.error(
      "ERROR: OURA_ACCESS_TOKEN environment variable is required for stdio mode.\n" +
        "For HTTP/web mode use SESSION_SECRET + cookie sessions (or Authorization header)."
    );
    process.exit(1);
  }
  return token.trim();
}

function createMcpServer(): McpServer {
  const server = new McpServer(SERVER_INFO);

  for (const tool of TOOL_DEFS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (params: any, _extra: any) => {
        try {
          const token = requireStdioToken();
          return await callTool(tool.name, params, {
            token,
            responseFormatFallback: ResponseFormat.MARKDOWN,
          });
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}

async function runStdio(): Promise<void> {
  requireStdioToken();
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Oura MCP Server running via stdio");
  console.error("🛠️  Available tools:", TOOL_DEFS.length);
}

function createHttpApp(): Express {
  const app = express();
  app.set("trust proxy", 1);
  app.use(
    express.json({
      limit: "1mb",
    })
  );

  app.get("/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      transport: "http",
      tools: TOOL_DEFS.length,
      session_secret_configured: !!process.env.SESSION_SECRET,
      ...oauthConfigSummary(),
    });
  });

  app.get("/api/tools", (_req, res) => {
    res.json({ tools: listTools() });
  });

  app.get("/api/session", async (req, res) => {
    const info = await getSessionInfo(req);
    res.json({ ...info, ...oauthConfigSummary() });
  });

  app.post("/api/session", async (req, res) => {
    try {
      const token = typeof req.body?.token === "string" ? req.body.token : "";
      await setSessionCookie(res, token);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Failed to set session" });
    }
  });

  app.delete("/api/session", (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.post("/api/tools/call", async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const args =
      typeof req.body?.arguments === "object" && req.body.arguments
        ? req.body.arguments
        : {};
    const responseFormat =
      req.body?.response_format === "json" || req.body?.response_format === "markdown"
        ? req.body.response_format
        : undefined;

    const { token } = await getTokenForRequestWithRefresh(req, res);
    if (!token) {
      res.status(401).json({
        error:
          "Missing token. Save a token in the UI or send Authorization: Bearer <token>.",
      });
      return;
    }

    try {
      const mergedArgs = responseFormat ? { ...args, response_format: responseFormat } : args;
      const result = await callTool(name, mergedArgs, {
        token,
        responseFormatFallback: ResponseFormat.MARKDOWN,
        userAgent: req.header("user-agent") ?? undefined,
      });
      res.json({
        text: result.content?.[0]?.text ?? "",
        structured: (result.structuredData ?? result.structuredContent?.data) ?? null,
        content: result.content ?? [],
      });
    } catch (e: any) {
      res.status(400).json({ error: e?.message ?? "Tool call failed" });
    }
  });

  app.post("/mcp", async (req, res) => {
    const parsed = z
      .object({
        jsonrpc: z.literal("2.0"),
        id: z.any().optional(),
        method: z.string(),
        params: z.any().optional(),
      })
      .safeParse(req.body);

    if (!parsed.success) {
      res
        .status(400)
        .json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } });
      return;
    }

    const { token } = await getTokenForRequestWithRefresh(req, res);
    const reply = await handleJsonRpc(
      parsed.data as any,
      {
        listTools,
        callTool: async (toolName, toolArgs, opts) =>
          callTool(toolName, toolArgs, {
            token: opts.token,
            responseFormatFallback: opts.responseFormatFallback,
            userAgent: req.header("user-agent") ?? undefined,
          }),
        serverInfo: SERVER_INFO,
      },
      { token }
    );

    res.json(reply);
  });

  app.get("/oauth/start", async (req, res) => {
    try {
      await oauthStart(req, res);
    } catch (e: any) {
      res.status(400).send(e?.message ?? "OAuth not configured");
    }
  });

  app.get("/oauth/callback", async (req, res) => {
    try {
      await oauthCallback(req, res);
    } catch (e: any) {
      res.status(400).send(e?.message ?? "OAuth callback failed");
    }
  });

  app.get("/oauth/logout", async (req, res) => {
    await oauthLogout(req, res);
  });

  app.get("/", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(getIndexHtml());
  });

  app.all("*", (_req, res) => {
    res.status(404).json({
      error: "Not Found",
      message:
        "Available endpoints: GET /, GET /health, GET /api/tools, POST /api/tools/call, POST /mcp",
    });
  });

  app.use(
    (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error("Unhandled HTTP error:", err);
      if (res.headersSent) return;
      res.status(500).json({
        error: "Internal Server Error",
        message: "An unexpected error occurred.",
      });
    }
  );

  return app;
}

async function runHTTP(appInstance: Express): Promise<void> {
  const port = parseInt(process.env.PORT || "3000", 10);
  await new Promise<void>((resolve) => {
    appInstance.listen(port, () => {
      console.error(`✅ Oura MCP Server running on http://localhost:${port}`);
      console.error(`🔗 /mcp JSON-RPC endpoint: http://localhost:${port}/mcp`);
      console.error(`🧰 /api/tools/call: http://localhost:${port}/api/tools/call`);
      console.error(`📊 Health check: http://localhost:${port}/health`);
      resolve();
    });
  });
}

const httpApp = createHttpApp();
export default httpApp;

async function main(): Promise<void> {
  const transport = process.env.TRANSPORT || "stdio";
  if (transport === "http") {
    await runHTTP(httpApp);
  } else {
    await runStdio();
  }
}

if (process.env.VERCEL !== "1") {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}
