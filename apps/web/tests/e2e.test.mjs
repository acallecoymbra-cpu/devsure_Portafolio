import assert from "node:assert/strict";
import { test } from "node:test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test("homepage smoke check when a local server is available", async (context) => {
  let response;
  try {
    response = await fetch(baseUrl);
  } catch {
    context.skip(`Start the app before running E2E: ${baseUrl}`);
    return;
  }

  assert.ok(response.ok, `Expected ${baseUrl} to return 2xx, got ${response.status}`);
  const html = await response.text();
  assert.match(html, /DevSure/);
});
