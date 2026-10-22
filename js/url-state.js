import { ALL_CATEGORIES, SORT_OPTIONS } from "./filtering.js";

export const MAX_QUERY_LENGTH = 160;
export const MAX_TAGS = 30;

export function readUrlState(search) {
  const params = new URLSearchParams(search);
  const sort = params.get("sort");

  return {
    query: (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH),
    category: params.get("category") ?? ALL_CATEGORIES,
    tags: params.getAll("tag").filter(Boolean).slice(0, MAX_TAGS),
    sort: SORT_OPTIONS.includes(sort) ? sort : "curated",
    view: params.get("view") === "saved" ? "saved" : "browse",
  };
}

export function buildUrlQuery({
  query = "",
  category = ALL_CATEGORIES,
  tags = [],
  sort = "curated",
  view = "browse",
} = {}) {
  const params = new URLSearchParams();
  const trimmedQuery = String(query).trim();

  if (trimmedQuery) params.set("q", trimmedQuery);
  if (category !== ALL_CATEGORIES) params.set("category", category);
  for (const tag of [...tags].sort((a, b) => a.localeCompare(b))) {
    params.append("tag", tag);
  }
  if (SORT_OPTIONS.includes(sort) && sort !== "curated") params.set("sort", sort);
  if (view === "saved") params.set("view", "saved");

  return params.toString();
}
