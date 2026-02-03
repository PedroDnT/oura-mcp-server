import test from "node:test";
import assert from "node:assert/strict";

import { handleJsonRpc } from "../http/jsonRpc.js";
import { callTool, listTools } from "../core/tools.js";
import { ResponseFormat } from "../constants.js";

test("json-rpc: tools/list returns tools", async () => {
  const reply = await handleJsonRpc(
    { jsonrpc: "2.0", id: 1, method: "tools/list" },
    {
      listTools,
      callTool: async (name, args, opts) => callTool(name, args, opts),
      serverInfo: { name: "oura-mcp-server", version: "1.0.0" },
    },
    { token: null }
  );

  assert.equal(reply.jsonrpc, "2.0");
  assert.equal((reply as any).id, 1);
  assert.ok(Array.isArray((reply as any).result?.tools));
  assert.ok(((reply as any).result.tools as any[]).length >= 9);
});

test("json-rpc: tools/call without token returns error", async () => {
  const reply = await handleJsonRpc(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "oura_get_daily_sleep", arguments: { start_date: "2026-01-01" } },
    },
    {
      listTools,
      callTool: async (name, args, opts) => callTool(name, args, opts),
      serverInfo: { name: "oura-mcp-server", version: "1.0.0" },
    },
    { token: null }
  );

  assert.ok("error" in reply);
  assert.equal((reply as any).error.code, -32001);
});

test("tools: invalid params are rejected before network call", async () => {
  await assert.rejects(
    () =>
      callTool(
        "oura_get_daily_sleep",
        { start_date: "not-a-date", response_format: "markdown" },
        { token: "fake", responseFormatFallback: ResponseFormat.MARKDOWN }
      ),
    /Invalid arguments/i
  );
});

