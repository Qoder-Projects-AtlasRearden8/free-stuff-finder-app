import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateDataset } from "../scripts/validate-data.js";

const data = JSON.parse(
  readFileSync(new URL("../data/resources.json", import.meta.url), "utf8"),
);

const validationDate = data.meta.lastReviewed;

test("the shipped directory passes schema and quality validation", () => {
  assert.deepEqual(validateDataset(data, { today: validationDate }), []);
});

test("the directory is substantial and covers all five resource types", () => {
  assert.ok(data.resources.length >= 50, "Expected at least 50 curated resources.");
  assert.equal(data.categories.length, 5);
  assert.deepEqual(
    data.categories.map(({ id }) => id),
    ["ai-tools", "courses", "software", "printables", "assistance"],
  );

  for (const category of data.categories) {
    const count = data.resources.filter(
      (resource) => resource.category === category.id,
    ).length;
    assert.ok(count >= 5, `${category.id} should have at least 5 resources.`);
  }
});

test("resource ids and URLs are unique", () => {
  const ids = data.resources.map(({ id }) => id);
  const urls = data.resources.map(({ url }) => url);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(urls).size, urls.length);
});

test("invalid categories and insecure links are rejected", () => {
  const invalid = structuredClone(data);
  invalid.resources[0].category = "not-a-real-category";
  invalid.resources[1].url = "http://insecure.example.com/";

  const errors = validateDataset(invalid, { today: validationDate });
  assert.ok(errors.some((error) => error.includes("does not match a category")));
  assert.ok(errors.some((error) => error.includes("must use https")));
});

test("duplicate ids, malformed dates, and missing caveats are rejected", () => {
  const invalid = structuredClone(data);
  invalid.resources[1].id = invalid.resources[0].id;
  invalid.resources[2].lastVerified = "2026-02-30";
  invalid.resources[3].caveat = "";

  const errors = validateDataset(invalid, { today: validationDate });
  assert.ok(errors.some((error) => error.includes("is duplicated")));
  assert.ok(errors.some((error) => error.includes("real date")));
  assert.ok(errors.some((error) => error.includes("caveat must be")));
});

test("future verification dates and missing required categories are rejected", () => {
  const invalid = structuredClone(data);
  invalid.meta.lastReviewed = "2999-01-01";
  invalid.resources[0].lastVerified = "2999-01-01";
  invalid.categories = invalid.categories.filter(
    (category) => category.id !== "printables",
  );

  const errors = validateDataset(invalid, { today: validationDate });
  assert.ok(errors.some((error) => error.includes("cannot be in the future")));
  assert.ok(errors.some((error) => error.includes("printables")));
});
