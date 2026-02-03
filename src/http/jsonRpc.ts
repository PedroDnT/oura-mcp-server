import { ResponseFormat } from "../constants.js";
import type { ToolListEntry, ToolResult } from "../core/tools.js";

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  method: string;
  params?: any;
};

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: any;
};

export type JsonRpcError = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: { code: number; message: string; data?: any };
};

export function jsonRpcOk(id: JsonRpcId, result: any): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

export function jsonRpcErr(id: JsonRpcId, code: number, message: string, data?: any): JsonRpcError {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

export type HandleJsonRpcDeps = {
  listTools: () => ToolListEntry[];
  callTool: (name: string, args: any, opts: { token: string; responseFormatFallback: ResponseFormat }) => Promise<ToolResult>;
  serverInfo: { name: string; version: string };
};

export async function handleJsonRpc(
  req: JsonRpcRequest,
  deps: HandleJsonRpcDeps,
  auth: { token: string | null }
): Promise<JsonRpcSuccess | JsonRpcError> {
  if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
    return jsonRpcErr(null, -32600, "Invalid Request");
  }

  const id: JsonRpcId = req.id ?? null;
  const method = req.method;

  if (method === "initialize") {
    return jsonRpcOk(id, {
      protocolVersion: "2024-11-05",
      serverInfo: deps.serverInfo,
      capabilities: {
        tools: {},
      },
    });
  }

  if (method === "tools/list") {
    return jsonRpcOk(id, { tools: deps.listTools() });
  }

  if (method === "tools/call") {
    const name = req.params?.name;
    const args = req.params?.arguments ?? {};
    if (typeof name !== "string" || name.length === 0) {
      return jsonRpcErr(id, -32602, "Invalid params: missing tool name");
    }
    if (!auth.token) {
      return jsonRpcErr(id, -32001, "Missing token: set Authorization header or cookie session");
    }
    try {
      const result = await deps.callTool(name, args, {
        token: auth.token,
        responseFormatFallback: ResponseFormat.MARKDOWN,
      });
      return jsonRpcOk(id, result);
    } catch (e: any) {
      return jsonRpcErr(id, -32002, e?.message ?? "Tool call failed");
    }
  }

  return jsonRpcErr(id, -32601, "Method not found");
}
