export const ALL_CATEGORIES = "all";
export const SORT_OPTIONS = ["curated", "recent", "name"];

/**
 * Turns a value into a compact, case-insensitive search string.
 * Accents are folded so "resume" can match "résumé".
 */
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function getSearchTerms(query) {
  const normalized = normalizeText(query);
  return normalized ? normalized.split(" ") : [];
}

function searchableText(resource) {
  return normalizeText(
    [
      resource.name,
      resource.provider,
      resource.category,
      resource.description,
      resource.freeTierLimits,
      resource.caveat,
      resource.region,
      ...(Array.isArray(resource.tags) ? resource.tags : []),
    ].join(" "),
  );
}

/**
 * Every search term must appear somewhere in the resource. This keeps
 * multi-word searches narrow instead of returning almost everything.
 */
export function matchesQuery(resource, query) {
  const terms = getSearchTerms(query);
  if (terms.length === 0) return true;

  const haystack = searchableText(resource);
  return terms.every((term) => haystack.includes(term));
}

export function matchesCategory(resource, category) {
  return !category || category === ALL_CATEGORIES || resource.category === category;
}

/**
 * Selected tags use AND semantics: a resource must carry every active tag.
 */
export function matchesTags(resource, selectedTags = []) {
  if (!Array.isArray(selectedTags) || selectedTags.length === 0) return true;
  const resourceTags = new Set(resource.tags ?? []);
  return selectedTags.every((tag) => resourceTags.has(tag));
}

export function matchesFavorites(resource, favoritesOnly = false, favorites = []) {
  if (!favoritesOnly) return true;
  const favoriteIds = favorites instanceof Set ? favorites : new Set(favorites);
  return favoriteIds.has(resource.id);
}

function compareByName(a, b) {
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

function compareByRecent(a, b) {
  const dateDifference = String(b.lastVerified).localeCompare(String(a.lastVerified));
  return dateDifference || compareByName(a, b);
}

export function sortResources(resources, sort = "curated") {
  const sorted = [...resources];

  if (sort === "recent") {
    return sorted.sort(compareByRecent);
  }

  if (sort === "name") {
    return sorted.sort(compareByName);
  }

  // The JSON order is the editorial order. Numbering it before sorting makes
  // the sort stable, even across older JavaScript engines.
  return sorted
    .map((resource, index) => ({ resource, index }))
    .sort((a, b) => a.index - b.index)
    .map(({ resource }) => resource);
}

export function filterResources(
  resources,
  {
    query = "",
    category = ALL_CATEGORIES,
    tags = [],
    favoritesOnly = false,
    favorites = [],
    sort = "curated",
  } = {},
) {
  const filtered = resources.filter(
    (resource) =>
      matchesQuery(resource, query) &&
      matchesCategory(resource, category) &&
      matchesTags(resource, tags) &&
      matchesFavorites(resource, favoritesOnly, favorites),
  );

  return sortResources(filtered, sort);
}

export function getCategoryCounts(resources) {
  const counts = Object.create(null);

  for (const resource of resources) {
    counts[resource.category] = (counts[resource.category] ?? 0) + 1;
  }

  return counts;
}

export function getTagCounts(resources) {
  const counts = new Map();

  for (const resource of resources) {
    for (const tag of resource.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function toggleValue(values, value) {
  const next = new Set(values);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return [...next];
}
