import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const html = readFileSync(path.join(ROOT, "index.html"), "utf8");

test("all local HTML references point to real files", () => {
  const references = [...html.matchAll(/(?:href|src)="(\.\/[^"#?]+)"/g)].map(
    ([, reference]) => reference,
  );

  assert.ok(references.length > 0);
  for (const reference of new Set(references)) {
    const target = path.resolve(ROOT, reference);
    assert.ok(
      existsSync(target),
      `Missing local file referenced by index.html: ${reference}`,
    );
  }
});

test("HTML ids are unique and required app hooks are present", () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(new Set(ids).size, ids.length, "Duplicate HTML id found.");

  for (const id of [
    "search-form",
    "search-input",
    "category-filters",
    "tag-filters",
    "resource-grid",
    "results-summary",
    "empty-state",
    "error-state",
    "filter-panel",
    "contribute-dialog",
  ]) {
    assert.ok(ids.includes(id), `Missing expected element #${id}.`);
  }

  assert.match(html, /<script type="module" src="\.\/js\/app\.js"><\/script>/);
});

test("the page includes accessible landmarks and a JavaScript fallback", () => {
  assert.match(html, /<a class="skip-link" href="#browse">/);
  assert.match(html, /<main>/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /href="\.\/data\/resources\.json"/);
});

test("license and documentation credit Asdale Dynamics, LLC", () => {
  const license = readFileSync(path.join(ROOT, "LICENSE"), "utf8");
  const readme = readFileSync(path.join(ROOT, "README.md"), "utf8");

  assert.match(license, /Copyright \(c\) 2026 Asdale Dynamics, LLC/);
  assert.match(readme, /Asdale Dynamics, LLC/);
});
