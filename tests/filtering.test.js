import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_CATEGORIES,
  filterResources,
  getCategoryCounts,
  getSearchTerms,
  getTagCounts,
  matchesCategory,
  matchesFavorites,
  matchesQuery,
  matchesTags,
  normalizeText,
  sortResources,
  toggleValue,
} from "../js/filtering.js";

const resources = [
  {
    id: "local-ai",
    name: "Local AI Studio",
    provider: "Example Labs",
    category: "ai-tools",
    description: "Run a model on your own laptop.",
    freeTierLimits: "Free and open source on your own hardware.",
    tags: ["Local AI", "Privacy", "Beginners"],
    region: "Global",
    lastVerified: "2026-09-01",
  },
  {
    id: "bookkeeping",
    name: "Café Ledger",
    provider: "Friendly Books",
    category: "software",
    description: "Plain-language bookkeeping for tiny teams.",
    freeTierLimits: "Free invoicing and expense tracking.",
    tags: ["Bookkeeping", "Small business"],
    region: "United States",
    lastVerified: "2026-10-20",
  },
  {
    id: "printable-budget",
    name: "Printable Budget",
    provider: "Paper Works",
    category: "printables",
    description: "A printable monthly budget and planner.",
    freeTierLimits: "Free PDFs with no account.",
    tags: ["Printables", "Bookkeeping", "Planning"],
    region: "Global",
    lastVerified: "2026-10-10",
    caveat: "Requires a printer and fresh ink.",
  },
];

test("normalizeText folds accents and collapses whitespace", () => {
  assert.equal(normalizeText("  Café   LEDGER "), "cafe ledger");
  assert.equal(normalizeText(null), "");
  assert.deepEqual(getSearchTerms("  Café   LEDGER "), ["cafe", "ledger"]);
});

test("search requires every term and checks names, tags, and descriptions", () => {
  assert.equal(matchesQuery(resources[0], "local privacy"), true);
  assert.equal(matchesQuery(resources[0], "local budget"), false);
  assert.equal(matchesQuery(resources[1], "cafe ledger"), true);
  assert.equal(matchesQuery(resources[1], "ebookkeeping"), false);
  assert.equal(matchesQuery(resources[2], "#printables"), false);
  assert.equal(matchesQuery(resources[2], "printer ink"), true);
  assert.equal(matchesQuery(resources[2], ""), true);
});

test("category and tag filters apply the documented semantics", () => {
  assert.equal(matchesCategory(resources[0], ALL_CATEGORIES), true);
  assert.equal(matchesCategory(resources[0], "software"), false);
  assert.equal(matchesTags(resources[0], []), true);
  assert.equal(matchesTags(resources[0], ["Local AI", "Privacy"]), true);
  assert.equal(matchesTags(resources[0], ["Local AI", "Bookkeeping"]), false);
});

test("favorite filtering accepts a Set and ignores unknown ids", () => {
  assert.equal(matchesFavorites(resources[1], true, new Set(["bookkeeping"])), true);
  assert.equal(matchesFavorites(resources[1], true, new Set(["missing"])), false);
  assert.equal(matchesFavorites(resources[1], false, new Set()), true);
});

test("sorting supports curated, recent, and alphabetical order", () => {
  assert.deepEqual(
    sortResources(resources, "name").map(({ id }) => id),
    ["bookkeeping", "local-ai", "printable-budget"],
  );
  assert.deepEqual(
    sortResources(resources, "recent").map(({ id }) => id),
    ["bookkeeping", "printable-budget", "local-ai"],
  );
  assert.deepEqual(
    sortResources(resources, "curated").map(({ id }) => id),
    ["local-ai", "bookkeeping", "printable-budget"],
  );
});

test("filterResources combines search, category, tags, favorites, and sort", () => {
  const results = filterResources(resources, {
    query: "book",
    category: "printables",
    tags: ["Bookkeeping"],
    favoritesOnly: true,
    favorites: new Set(["printable-budget"]),
    sort: "name",
  });
  assert.deepEqual(
    results.map(({ id }) => id),
    ["printable-budget"],
  );

  const noResults = filterResources(resources, {
    tags: ["Printables", "Privacy"],
  });
  assert.equal(noResults.length, 0);
});

test("category counts and tag counts are complete and deterministic", () => {
  assert.deepEqual({ ...getCategoryCounts(resources) }, {
    "ai-tools": 1,
    software: 1,
    printables: 1,
  });

  const tags = getTagCounts(resources);
  assert.equal(tags[0].tag, "Bookkeeping");
  assert.equal(tags[0].count, 2);
  assert.ok(tags.some(({ tag }) => tag === "Privacy"));
});

test("toggleValue returns a new array and does not mutate its input", () => {
  const original = ["one"];
  assert.deepEqual(toggleValue(original, "two"), ["one", "two"]);
  assert.deepEqual(toggleValue(original, "one"), []);
  assert.deepEqual(original, ["one"]);
});
