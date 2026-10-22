import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_QUERY_LENGTH,
  MAX_TAGS,
  buildUrlQuery,
  readUrlState,
} from "../js/url-state.js";

test("URL state parsing applies safe defaults", () => {
  assert.deepEqual(readUrlState(""), {
    query: "",
    category: "all",
    tags: [],
    sort: "curated",
    view: "browse",
  });
});

test("URL state parsing keeps repeated tags and valid options", () => {
  const state = readUrlState(
    "?q=local+privacy&category=software&tag=Privacy&tag=Local+AI&sort=name&view=saved",
  );

  assert.equal(state.query, "local privacy");
  assert.equal(state.category, "software");
  assert.deepEqual(state.tags, ["Privacy", "Local AI"]);
  assert.equal(state.sort, "name");
  assert.equal(state.view, "saved");
});

test("URL state parsing rejects invalid options and bounds input", () => {
  const state = readUrlState(
    `?q=${"a".repeat(MAX_QUERY_LENGTH + 20)}&sort=unexpected&view=other` +
      "&tag=One&tag=Two&tag=Three&tag=Four&tag=Five&tag=Six&tag=Seven&tag=Eight&tag=Nine&tag=Ten" +
      "&tag=Eleven&tag=Twelve&tag=Thirteen&tag=Fourteen&tag=Fifteen&tag=Sixteen&tag=Seventeen" +
      "&tag=Eighteen&tag=Nineteen&tag=Twenty&tag=TwentyOne&tag=TwentyTwo&tag=TwentyThree" +
      "&tag=TwentyFour&tag=TwentyFive&tag=TwentySix&tag=TwentySeven&tag=TwentyEight" +
      "&tag=TwentyNine&tag=Thirty&tag=ThirtyOne",
  );

  assert.equal(state.query.length, MAX_QUERY_LENGTH);
  assert.equal(state.sort, "curated");
  assert.equal(state.view, "browse");
  assert.equal(state.tags.length, MAX_TAGS);
});

test("URL building preserves every selected tag", () => {
  const query = buildUrlQuery({
    query: "  local privacy  ",
    category: "software",
    tags: ["Privacy", "Local AI", "Open source"],
    sort: "name",
    view: "saved",
  });
  const params = new URLSearchParams(query);

  assert.equal(params.get("q"), "local privacy");
  assert.equal(params.get("category"), "software");
  assert.deepEqual(params.getAll("tag"), ["Local AI", "Open source", "Privacy"]);
  assert.equal(params.get("sort"), "name");
  assert.equal(params.get("view"), "saved");
});

test("URL building omits default state and round-trips categories", () => {
  assert.equal(buildUrlQuery(), "");

  const query = buildUrlQuery({
    query: "",
    category: "all",
    tags: [],
    sort: "curated",
    view: "browse",
  });
  assert.equal(query, "");

  const restored = readUrlState(
    `?${buildUrlQuery({ query: "café", tags: ["Privacy", "Chess"] })}`,
  );
  assert.equal(restored.query, "café");
  assert.deepEqual(restored.tags, ["Chess", "Privacy"]);
});
