import { randomBytes } from "node:crypto";
import axios from "axios";
import type { Request, Response } from "express";

import { sealToken, unsealToken } from "./session.js";
import { clearSessionCookie, setOAuthSessionCookie } from "./session.js";

const OAUTH_COOKIE = "oura_oauth";
const OAUTH_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

type OAuthState = {
  state: string;
  created_at: number;
};

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomState(): string {
  return b64url(randomBytes(32));
}

function serializeCookie(
  name: string,
  value: string,
  opts: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "Lax" | "Strict" | "None";
    path: string;
    maxAge: number;
  }
): string {
  const encValue = encodeURIComponent(value);
  const segments = [`${name}=${encValue}`];
  segments.push(`Path=${opts.path}`);
  segments.push(`Max-Age=${opts.maxAge}`);
  segments.push(`SameSite=${opts.sameSite}`);
  if (opts.httpOnly) segments.push("HttpOnly");
  if (opts.secure) segments.push("Secure");
  return segments.join("; ");
}

function parseCookie(header: string, name: string): string | null {
  const parts = header.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.substring(0, idx).trim();
    if (k !== name) continue;
    const v = part.substring(idx + 1).trim();
    return v.length > 0 ? decodeURIComponent(v) : null;
  }
  return null;
}

async function setOAuthStateCookie(res: Response, payload: OAuthState): Promise<void> {
  // Reuse the same sealing format as our session token helper.
  // We don't expose this value to JS, and it expires quickly.
  const sealed = await sealToken(JSON.stringify(payload));
  const secure = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(OAUTH_COOKIE, sealed, {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      maxAge: OAUTH_MAX_AGE_SECONDS,
    })
  );
}

async function readOAuthStateCookie(req: Request): Promise<OAuthState | null> {
  const cookieHeader = req.header("cookie");
  if (typeof cookieHeader !== "string" || cookieHeader.length === 0) return null;
  const v = parseCookie(cookieHeader, OAUTH_COOKIE);
  if (!v) return null;
  const unsealed = await unsealToken(v);
  if (!unsealed) return null;
  try {
    const parsed = JSON.parse(unsealed) as any;
    if (typeof parsed?.state !== "string") return null;
    if (typeof parsed?.created_at !== "number") return null;
    if (Date.now() - parsed.created_at > OAUTH_MAX_AGE_SECONDS * 1000) return null;
    return { state: parsed.state, created_at: parsed.created_at };
  } catch {
    return null;
  }
}

function clearOAuthStateCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serializeCookie(OAUTH_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    })
  );
}

function getClientConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
} {
  const clientId = process.env.OURA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.OURA_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.OURA_OAUTH_REDIRECT_URI;

  if (typeof clientId !== "string" || clientId.trim().length === 0) {
    throw new Error("Missing OURA_OAUTH_CLIENT_ID");
  }
  if (typeof clientSecret !== "string" || clientSecret.trim().length === 0) {
    throw new Error("Missing OURA_OAUTH_CLIENT_SECRET");
  }
  if (typeof redirectUri !== "string" || redirectUri.trim().length === 0) {
    throw new Error("Missing OURA_OAUTH_REDIRECT_URI");
  }

  const scopes =
    typeof process.env.OURA_OAUTH_SCOPES === "string" &&
    process.env.OURA_OAUTH_SCOPES.trim().length > 0
      ? process.env.OURA_OAUTH_SCOPES.trim()
      : "daily heartrate personal sleep workout session tag";

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
    redirectUri: redirectUri.trim(),
    scopes,
  };
}

export async function oauthStart(_req: Request, res: Response): Promise<void> {
  const cfg = getClientConfig();
  const state = randomState();
  await setOAuthStateCookie(res, { state, created_at: Date.now() });

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: cfg.scopes,
    state,
  });

  const url = `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
  res.redirect(url);
}

export async function oauthCallback(req: Request, res: Response): Promise<void> {
  const cfg = getClientConfig();

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  const stored = await readOAuthStateCookie(req);
  clearOAuthStateCookie(res);

  if (!stored || stored.state !== state) {
    res.status(400).send("Invalid state");
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
  });

  const resp = await axios.post("https://api.ouraring.com/oauth/token", body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30000,
  });

  await setOAuthSessionCookie(res, resp.data as any);
  res.redirect("/?connected=1");
}

export async function oauthLogout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.redirect("/?disconnected=1");
}

export function oauthConfigured(): boolean {
  try {
    getClientConfig();
    return true;
  } catch {
    return false;
  }
}

export function oauthConfigSummary(): {
  oauth_configured: boolean;
  redirect_uri?: string;
  scopes?: string;
} {
  try {
    const cfg = getClientConfig();
    return { oauth_configured: true, redirect_uri: cfg.redirectUri, scopes: cfg.scopes };
  } catch {
    return { oauth_configured: false };
  }
}
