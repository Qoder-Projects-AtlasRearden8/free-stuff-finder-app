import assert from "node:assert/strict";
import test from "node:test";
import { once } from "node:events";

import { createStaticServer } from "../scripts/serve.js";

async function withServer(callback) {
  const server = createStaticServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("the local server serves the app and its JSON data", async () => {
  await withServer(async (baseUrl) => {
    const page = await fetch(`${baseUrl}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get("content-type"), /text\/html/);
    assert.match(await page.text(), /Freebie Finder/);

    const data = await fetch(`${baseUrl}/data/resources.json`);
    assert.equal(data.status, 200);
    assert.match(data.headers.get("content-type"), /application\/json/);
    const parsed = await data.json();
    assert.ok(Array.isArray(parsed.resources));
  });
});

test("the server handles HEAD, missing files, and unsupported methods safely", async () => {
  await withServer(async (baseUrl) => {
    const head = await fetch(`${baseUrl}/css/styles.css`, { method: "HEAD" });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");

    const missing = await fetch(`${baseUrl}/not-a-real-file`);
    assert.equal(missing.status, 404);

    const unsupported = await fetch(`${baseUrl}/`, { method: "POST" });
    assert.equal(unsupported.status, 405);
    assert.equal(unsupported.headers.get("allow"), "GET, HEAD");
    assert.equal(unsupported.headers.get("x-content-type-options"), "nosniff");
  });
});
