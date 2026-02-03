import test from "node:test";
import assert from "node:assert/strict";

import { getTokenFromRequest, sealToken, unsealToken } from "../http/session.js";

test("session: seal/unseal roundtrip", async () => {
  process.env.SESSION_SECRET = "test_secret_please_change_32_bytes_min_____";
  const sealed = await sealToken("tok_1234567890");
  const unsealed = await unsealToken(sealed);
  assert.equal(unsealed, "tok_1234567890");
});

test("session: Authorization header overrides cookie", async () => {
  process.env.SESSION_SECRET = "test_secret_please_change_32_bytes_min_____";
  const sealed = await sealToken("cookie_token_abcdef");

  const req = {
    header(name: string) {
      if (name.toLowerCase() === "authorization") return "Bearer header_token_xyz";
      if (name.toLowerCase() === "cookie") return `oura_session=${encodeURIComponent(sealed)}`;
      return undefined;
    },
    query: {},
  } as any;

  const got = await getTokenFromRequest(req);
  assert.equal(got.token, "header_token_xyz");
  assert.equal(got.source, "authorization");
});

test("session: cookie works when no Authorization header", async () => {
  process.env.SESSION_SECRET = "test_secret_please_change_32_bytes_min_____";
  const sealed = await sealToken("cookie_token_only");

  const req = {
    header(name: string) {
      if (name.toLowerCase() === "cookie") return `oura_session=${encodeURIComponent(sealed)}`;
      return undefined;
    },
    query: {},
  } as any;

  const got = await getTokenFromRequest(req);
  assert.equal(got.token, "cookie_token_only");
  assert.equal(got.source, "cookie");
});

