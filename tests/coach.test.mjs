import test from "node:test";
import assert from "node:assert/strict";
import coach, { config } from "../netlify/functions/coach.mjs";

const url = "https://satzkraft.example/.netlify/functions/coach";
const originalFetch = globalThis.fetch;
const originalKey = process.env.ANTHROPIC_API_KEY;
const originalError = console.error;

function request(messages, options = {}) {
  const headers = {
    "content-type": options.contentType || "application/json",
    ...(options.headers || {})
  };
  if (options.origin !== null) {
    headers.origin = options.origin || "https://satzkraft.example";
  }
  return new Request(url, {
    method: options.method || "POST",
    headers,
    signal: options.signal,
    body: (options.method || "POST") === "POST" ? JSON.stringify({ messages }) : undefined
  });
}

test("coach endpoint security", async t => {
  console.error = () => {};
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  });

  await t.test("defines native Netlify rate limiting", () => {
    assert.equal(config.path, "/.netlify/functions/coach");
    assert.equal(config.method, "POST");
    assert.deepEqual(config.rateLimit.aggregateBy, ["ip", "domain"]);
    assert.equal(config.rateLimit.windowLimit, 6);
    assert.equal(config.rateLimit.windowSize, 180);
  });

  await t.test("blocks wrong methods, origins and content types", async () => {
    const wrongMethod = await coach(request([], { method: "GET" }));
    assert.equal(wrongMethod.status, 405);
    assert.equal(wrongMethod.headers.get("allow"), "POST");
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { origin: null }))).status, 403);
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { origin: "https://attacker.example" }))).status, 403);
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { contentType: "text/plain" }))).status, 415);
    assert.equal((await coach(request([{ role: "user", content: "Plan" }], { contentType: "application/jsonp" }))).status, 415);
    assert.notEqual((await coach(request([], { contentType: "application/json; charset=utf-8" }))).status, 415);
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

  await t.test("rejects oversized conversations instead of silently dropping the original briefing", async () => {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return new Response(); };
    const messages = Array.from({ length: 11 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: index === 0 ? "ORIGINAL-BRIEFING" : `m${index}`
    }));
    const response = await coach(request(messages));
    assert.equal(response.status, 413);
    assert.equal(calls, 0);
    assert.match((await response.json()).error, /zu lang/);
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
      return Response.json({
        type: "message",
        role: "assistant",
        stop_reason: "end_turn",
        content: [{ type: "text", text: "{\"format\":\"trainings-block\"}" }]
      });
    };
    const response = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(providerBody.messages.length, 1);
    assert.equal(providerBody.model, "claude-sonnet-4-6");
    assert.match(providerBody.system, /"timerMode":"target"/);
    assert.match(providerBody.system, /"timerMode":"max"/);
    assert.match(providerBody.system, /"reps":\[minSekunden,maxSekunden\]/);
  });

  await t.test("keeps provider errors generic", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    globalThis.fetch = async () => Response.json({ error: { message: "secret upstream detail" } }, { status: 429 });
    const response = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes("secret upstream detail"), false);
    assert.match(body.error, /ausgelastet/);
  });

  await t.test("rejects incomplete or malformed provider success responses", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    globalThis.fetch = async () => Response.json({
      type: "message",
      role: "assistant",
      stop_reason: "max_tokens",
      content: [{ type: "text", text: "{\"format\":\"trainings-block\"" }]
    });
    const truncated = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(truncated.status, 502);
    assert.match((await truncated.json()).error, /zu lang/);

    globalThis.fetch = async () => Response.json({ type: "message", role: "assistant", stop_reason: "end_turn", content: {} });
    const malformed = await coach(request([{ role: "user", content: "Plan" }]));
    assert.equal(malformed.status, 502);
    assert.equal((await malformed.json()).error, "KI-Coach hat keine verwertbare Antwort geliefert");
  });

  await t.test("aborts the provider request when the client disconnects", async () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    const client = new AbortController();
    let providerSignal;
    let providerStarted;
    const started = new Promise(resolve => { providerStarted = resolve; });
    globalThis.fetch = async (_url, options) => {
      providerSignal = options.signal;
      providerStarted();
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    };
    const responsePromise = coach(request([{ role: "user", content: "Plan" }], { signal: client.signal }));
    await started;
    client.abort();
    const response = await responsePromise;
    assert.equal(response.status, 499);
    assert.equal(providerSignal.aborted, true);
  });
});
