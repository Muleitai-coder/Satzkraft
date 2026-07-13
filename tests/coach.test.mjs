import test from "node:test";
import assert from "node:assert/strict";
import coach, { config } from "../netlify/functions/coach.mjs";

const url = "https://satzkraft.example/.netlify/functions/coach";
const originalFetch = globalThis.fetch;
const originalKey = process.env.ANTHROPIC_API_KEY;
const originalError = console.error;

function request(messages, options = {}) {
  return new Request(url, {
    method: options.method || "POST",
    headers: {
      origin: options.origin || "https://satzkraft.example",
      "content-type": options.contentType || "application/json",
      ...(options.headers || {})
    },
    body: (options.method || "POST") === "POST" ? JSON.stringify({ messages }) : undefined
  });
}

test("coach endpoint security", async t => {
  console.error = () => {};

  await t.test("defines native Netlify rate limiting", () => {
    assert.equal(config.path, "/.netlify/functions/coach");
    assert.equal(config.method, "POST");
    assert.deepEqual(config.rateLimit.aggregateBy, ["ip", "domain"]);
    assert.equal(config.rateLimit.windowLimit, 6);
  });

  await t.test("blocks wrong methods, origins and content types", async () => {
    assert.equal((await coach(request([], { method: "GET" }))).status, 405);
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { origin: "https://attacker.example" }))).status, 403);
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { contentType: "text/plain" }))).status, 415);
  });

  await t.test("rejects malformed conversations before calling the provider", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(); };
    const response = await coach(request([
      { role: "user", content: "Plan" },
      { role: "user", content: "Noch ein Plan" }
    ]));
    assert.equal(response.status, 400);
    assert.equal(calls, 0);
  });

  await t.test("does not reveal missing configuration details", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const response = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.error, "KI-Coach ist momentan nicht verfügbar");
    assert.equal(JSON.stringify(body).includes("ANTHROPIC_API_KEY"), false);
  });

  await t.test("returns a valid provider response and sends no cacheable result", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    let providerBody;
    globalThis.fetch = async (_url, options) => {
      providerBody = JSON.parse(options.body);
      return Response.json({ content: [{ type: "text", text: "{\"format\":\"trainings-block\"}" }] });
    };
    const response = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(providerBody.messages.length, 1);
  });

  await t.test("keeps provider errors generic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    globalThis.fetch = async () => Response.json({ error: { message: "secret upstream detail" } }, { status: 429 });
    const response = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes("secret upstream detail"), false);
  });

  globalThis.fetch = originalFetch;
  console.error = originalError;
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
});
