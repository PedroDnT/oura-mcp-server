import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Request, Response } from "express";
import axios from "axios";

const COOKIE_NAME = "oura_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type StoredSessionV2 = {
  v: 2;
  access_token: string;
  refresh_token?: string;
  expires_at?: number; // unix ms
  scope?: string;
  token_type?: string;
  source?: "oauth" | "manual";
};

type StoredSession = StoredSessionV2 | { v: 1; access_token: string };

function getSessionSecret(): string | undefined {
  const secret = process.env.SESSION_SECRET;
  return typeof secret === "string" && secret.trim().length > 0 ? secret : undefined;
}

function secretToKey(secret: string): Uint8Array {
  // Derive a stable 32-byte key for A256GCM from arbitrary secret material.
  return createHash("sha256").update(secret).digest();
}

function b64urlEncode(buf: Uint8Array): string {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return new Uint8Array(Buffer.from(b64, "base64"));
}

type SealedPayload = { exp: number; data: unknown };

async function sealData(data: unknown, maxAgeSeconds: number): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is required");

  const key = secretToKey(secret);
  const iv = randomBytes(12);
  const payload: SealedPayload = {
    exp: Date.now() + maxAgeSeconds * 1000,
    data,
  };
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${b64urlEncode(iv)}.${b64urlEncode(tag)}.${b64urlEncode(ciphertext)}`;
}

async function unsealData(sessionValue: string): Promise<unknown | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  try {
    const [ivS, tagS, ctS] = sessionValue.split(".");
    if (!ivS || !tagS || !ctS) return null;

    const key = secretToKey(secret);
    const iv = b64urlDecode(ivS);
    const tag = b64urlDecode(tagS);
    const ciphertext = b64urlDecode(ctS);

    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(tag));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertext)),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(plaintext) as any;
    const exp = typeof parsed?.exp === "number" ? parsed.exp : 0;
    if (!exp || Date.now() > exp) return null;
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export async function sealToken(token: string): Promise<string> {
  // Backwards-compatible: seal a bare token string as a v1 session.
  const session: StoredSession = { v: 1, access_token: token.trim() };
  return sealData(session, MAX_AGE_SECONDS);
}

export async function unsealToken(sessionValue: string): Promise<string | null> {
  const data = await unsealData(sessionValue);
  if (!data) return null;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data) {
    const t = (data as any).access_token;
    return typeof t === "string" && t.length > 0 ? t : null;
  }
  return null;
}

export async function sealSession(session: StoredSessionV2): Promise<string> {
  return sealData(session, MAX_AGE_SECONDS);
}

export async function unsealSession(sessionValue: string): Promise<StoredSessionV2 | null> {
  const data = await unsealData(sessionValue);
  if (!data || typeof data !== "object") return null;
  const v = (data as any).v;
  if (v === 2) {
    const access = (data as any).access_token;
    if (typeof access !== "string" || access.length === 0) return null;
    return data as StoredSessionV2;
  }
  if (v === 1) {
    const access = (data as any).access_token;
    if (typeof access !== "string" || access.length === 0) return null;
    return { v: 2, access_token: access, source: "manual" };
  }
  return null;
}

function isProbablyBearerToken(token: string): boolean {
  // Oura tokens are opaque; keep validation intentionally permissive.
  const trimmed = token.trim();
  if (trimmed.length < 16 || trimmed.length > 2048) return false;
  return true;
}

export function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production";
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  }));
}

export async function setSessionCookie(res: Response, token: string): Promise<void> {
  if (!isProbablyBearerToken(token)) {
    throw new Error("Token format looks invalid");
  }

  const secure = process.env.NODE_ENV === "production";
  const sealed = await sealSession({ v: 2, access_token: token.trim(), source: "manual" });
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, sealed, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  }));
}

export async function setOAuthSessionCookie(
  res: Response,
  session: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  }
): Promise<void> {
  if (!isProbablyBearerToken(session.access_token)) {
    throw new Error("Access token format looks invalid");
  }
  const secure = process.env.NODE_ENV === "production";
  const expiresAt =
    typeof session.expires_in === "number"
      ? Date.now() + session.expires_in * 1000
      : undefined;

  const sealed = await sealSession({
    v: 2,
    access_token: session.access_token.trim(),
    refresh_token: typeof session.refresh_token === "string" ? session.refresh_token : undefined,
    expires_at: expiresAt,
    scope: typeof session.scope === "string" ? session.scope : undefined,
    token_type: typeof session.token_type === "string" ? session.token_type : undefined,
    source: "oauth",
  });

  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, sealed, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  }));
}

function parseBearerAuth(value: string): string | null {
  const prefix = "bearer ";
  if (value.length < prefix.length) return null;
  if (value.substring(0, prefix.length).toLowerCase() !== prefix) return null;
  const token = value.substring(prefix.length).trim();
  return token.length > 0 ? token : null;
}

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function getTokenFromRequest(req: Request): Promise<{
  token: string | null;
  source: "authorization" | "cookie" | "env" | "none";
}> {
  const authHeader = req.header("authorization");
  if (typeof authHeader === "string") {
    const bearer = parseBearerAuth(authHeader);
    if (bearer) return { token: bearer, source: "authorization" };
  }

  const cookieHeader = req.header("cookie");
  if (typeof cookieHeader === "string" && cookieHeader.length > 0) {
    const value = parseCookie(cookieHeader, COOKIE_NAME);
    if (value) {
      const unsealed = await unsealToken(value);
      if (unsealed) return { token: unsealed, source: "cookie" };
    }
  }

  const fallback = process.env.OURA_ACCESS_TOKEN;
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    // Avoid accidentally preferring env tokens if user explicitly cleared session cookie.
    // If caller sets `?no_env=1`, skip env fallback.
    const noEnv = typeof req.query?.no_env === "string" && safeEq(req.query.no_env, "1");
    if (!noEnv) return { token: fallback.trim(), source: "env" };
  }

  return { token: null, source: "none" };
}

export async function getSessionInfo(req: Request): Promise<{
  has_token: boolean;
  source: "authorization" | "cookie" | "env" | "none";
  expires_at?: number;
  scope?: string;
  has_refresh_token?: boolean;
}> {
  const authHeader = req.header("authorization");
  if (typeof authHeader === "string") {
    const bearer = parseBearerAuth(authHeader);
    if (bearer) return { has_token: true, source: "authorization" };
  }

  const cookieHeader = req.header("cookie");
  if (typeof cookieHeader === "string" && cookieHeader.length > 0) {
    const value = parseCookie(cookieHeader, COOKIE_NAME);
    if (value) {
      const session = await unsealSession(value);
      if (session) {
        return {
          has_token: true,
          source: "cookie",
          expires_at: session.expires_at,
          scope: session.scope,
          has_refresh_token: typeof session.refresh_token === "string" && session.refresh_token.length > 0,
        };
      }
    }
  }

  const fallback = process.env.OURA_ACCESS_TOKEN;
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    return { has_token: true, source: "env" };
  }

  return { has_token: false, source: "none" };
}

function getOauthClient(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.OURA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.OURA_OAUTH_CLIENT_SECRET;
  if (typeof clientId !== "string" || clientId.trim().length === 0) return null;
  if (typeof clientSecret !== "string" || clientSecret.trim().length === 0) return null;
  return { clientId: clientId.trim(), clientSecret: clientSecret.trim() };
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  token_type?: string;
}> {
  const client = getOauthClient();
  if (!client) throw new Error("OAuth client not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: client.clientId,
    client_secret: client.clientSecret,
  });

  const resp = await axios.post("https://api.ouraring.com/oauth/token", body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 30000,
  });
  return resp.data as any;
}

export async function getTokenForRequestWithRefresh(
  req: Request,
  res: Response
): Promise<{ token: string | null; source: "authorization" | "cookie" | "env" | "none" }> {
  const authHeader = req.header("authorization");
  if (typeof authHeader === "string") {
    const bearer = parseBearerAuth(authHeader);
    if (bearer) return { token: bearer, source: "authorization" };
  }

  const cookieHeader = req.header("cookie");
  if (typeof cookieHeader === "string" && cookieHeader.length > 0) {
    const value = parseCookie(cookieHeader, COOKIE_NAME);
    if (value) {
      const session = await unsealSession(value);
      if (session) {
        const token = session.access_token;
        const expiresAt = session.expires_at;
        const needsRefresh =
          typeof expiresAt === "number" && expiresAt > 0 && Date.now() > expiresAt - 60_000;

        if (!needsRefresh) return { token, source: "cookie" };

        if (typeof session.refresh_token !== "string" || session.refresh_token.length === 0) {
          return { token, source: "cookie" };
        }

        try {
          const refreshed = await refreshAccessToken(session.refresh_token);
          await setOAuthSessionCookie(res, refreshed);
          return { token: refreshed.access_token, source: "cookie" };
        } catch {
          clearSessionCookie(res);
          return { token: null, source: "none" };
        }
      }
    }
  }

  const fallback = process.env.OURA_ACCESS_TOKEN;
  if (typeof fallback === "string" && fallback.trim().length > 0) {
    const noEnv = typeof req.query?.no_env === "string" && safeEq(req.query.no_env, "1");
    if (!noEnv) return { token: fallback.trim(), source: "env" };
  }

  return { token: null, source: "none" };
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
