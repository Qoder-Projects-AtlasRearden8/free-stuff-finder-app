import {
  ALL_CATEGORIES,
  SORT_OPTIONS,
  filterResources,
  getCategoryCounts,
  getTagCounts,
  toggleValue,
} from "./filtering.js";
import {
  MAX_QUERY_LENGTH,
  buildUrlQuery,
  readUrlState,
} from "./url-state.js";

const DATA_URL = new URL("../data/resources.json", import.meta.url);
const FAVORITES_KEY = "freebie-finder:favorites:v1";
const TAG_LIMIT = 12;
const AGING_DAYS = 180;

const ICONS = {
  external:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4L19 6.5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.3"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
  arrow:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
  spark:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/><path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="currentColor"/></svg>',
};

const state = {
  resources: [],
  categories: [],
  categoryById: new Map(),
  meta: {},
  availableTags: new Set(),
  ready: false,
  query: "",
  category: ALL_CATEGORIES,
  tags: new Set(),
  sort: "curated",
  view: "browse",
  tagsExpanded: false,
  favorites: loadFavorites(),
};

const dom = {
  browseSection: document.querySelector("#browse"),
  searchForm: document.querySelector("#search-form"),
  searchInput: document.querySelector("#search-input"),
  searchClear: document.querySelector("#search-clear"),
  categoryFilters: document.querySelector("#category-filters"),
  tagFilters: document.querySelector("#tag-filters"),
  tagExpand: document.querySelector("#tag-expand"),
  activeFilters: document.querySelector("#active-filters"),
  resetFilters: document.querySelector("#reset-filters"),
  sortSelect: document.querySelector("#sort-select"),
  resourceGrid: document.querySelector("#resource-grid"),
  resultsSummary: document.querySelector("#results-summary"),
  emptyState: document.querySelector("#empty-state"),
  emptyTitle: document.querySelector("#empty-title"),
  emptyCopy: document.querySelector("#empty-copy"),
  emptyAction: document.querySelector("#empty-action"),
  errorState: document.querySelector("#error-state"),
  retryLoad: document.querySelector("#retry-load"),
  filterToggle: document.querySelector("#filter-toggle"),
  filterPanel: document.querySelector("#filter-panel"),
  filterCount: document.querySelector("#filter-count"),
  closeFilters: document.querySelector("#close-filters"),
  navBrowse: document.querySelector("#nav-browse"),
  navSaved: document.querySelector("#nav-saved"),
  navSavedCount: document.querySelector("#nav-saved-count"),
  statTotal: document.querySelector("#stat-total"),
  statCategories: document.querySelector("#stat-categories"),
  statNoteCount: document.querySelector("#stat-note-count"),
  lastReviewed: document.querySelector("#last-reviewed"),
  currentYear: document.querySelector("#current-year"),
  contributeDialog: document.querySelector("#contribute-dialog"),
  openContributeButtons: document.querySelectorAll("[data-open-contribute]"),
  closeContributeButtons: document.querySelectorAll("[data-close-dialog]"),
  toast: document.querySelector("#toast"),
  toastMessage: document.querySelector("#toast-message"),
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

let toastTimer = null;

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
}

function asDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value, formatter = dateFormatter) {
  const date = asDate(value);
  return date ? formatter.format(date) : "Date unknown";
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function truncate(value, length = 38) {
  const text = String(value);
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text;
}

function loadFavorites() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
    if (!Array.isArray(stored)) return new Set();
    return new Set(
      stored
        .filter((id) => typeof id === "string")
        .slice(0, 500),
    );
  } catch {
    return new Set();
  }
}

function persistFavorites() {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
  } catch {
    // Saving still works for this visit if the browser blocks local storage.
  }
}

function readStateFromUrl() {
  const urlState = readUrlState(window.location.search);
  state.query = urlState.query;
  state.category = urlState.category;
  state.tags = new Set(urlState.tags);
  state.sort = urlState.sort;
  state.view = urlState.view;
}

function writeStateToUrl() {
  const queryString = buildUrlQuery(state);
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;

  try {
    window.history.replaceState(null, "", nextUrl);
  } catch {
    // Filtering should still work under restrictive history policies.
  }
}

function getActiveFilterCount() {
  return (
    (state.query.trim() ? 1 : 0) +
    (state.category !== ALL_CATEGORIES ? 1 : 0) +
    state.tags.size
  );
}

function isFiltered() {
  return getActiveFilterCount() > 0;
}

function getCategoryLabel(categoryId) {
  return state.categoryById.get(categoryId)?.label ?? categoryId;
}

function showLoading() {
  dom.errorState.hidden = true;
  dom.emptyState.hidden = true;
  dom.resourceGrid.hidden = false;
  dom.resourceGrid.setAttribute("aria-busy", "true");
  dom.resultsSummary.textContent = "Loading the shelf…";
  dom.resourceGrid.innerHTML = Array.from(
    { length: 4 },
    () => `
      <div class="skeleton-card" aria-hidden="true">
        <span class="skeleton-line skeleton-line--short"></span>
        <span class="skeleton-line skeleton-line--title"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line"></span>
        <span class="skeleton-line skeleton-line--box"></span>
      </div>`,
  ).join("");
}

async function loadResources() {
  showLoading();
  dom.retryLoad.disabled = true;

  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.resources) || !Array.isArray(data.categories)) {
      throw new Error("The resource file is missing its directory data.");
    }

    state.resources = data.resources;
    state.categories = data.categories;
    state.meta = data.meta ?? {};
    state.categoryById = new Map(
      data.categories.map((category) => [category.id, category]),
    );
    state.availableTags = new Set(
      data.resources.flatMap((resource) =>
        Array.isArray(resource.tags) ? resource.tags : [],
      ),
    );

    normalizeStateForData();
    pruneFavorites();
    state.ready = true;
    dom.retryLoad.disabled = false;

    renderCategoryFilters();
    renderTagFilters();
    renderStaticFacts();
    render();
  } catch (error) {
    console.error("Freebie Finder could not load the directory:", error);
    state.ready = false;
    dom.resourceGrid.innerHTML = "";
    dom.resourceGrid.hidden = true;
    dom.resourceGrid.setAttribute("aria-busy", "false");
    dom.emptyState.hidden = true;
    dom.errorState.hidden = false;
    dom.resultsSummary.textContent = "The directory could not load.";
    dom.retryLoad.disabled = false;
  }
}

function normalizeStateForData() {
  if (
    state.category !== ALL_CATEGORIES &&
    !state.categoryById.has(state.category)
  ) {
    state.category = ALL_CATEGORIES;
  }

  state.tags = new Set(
    [...state.tags].filter((tag) => state.availableTags.has(tag)),
  );
  state.query = state.query.slice(0, MAX_QUERY_LENGTH);
}

function pruneFavorites() {
  const resourceIds = new Set(state.resources.map((resource) => resource.id));
  const validFavorites = [...state.favorites].filter((id) => resourceIds.has(id));
  if (validFavorites.length !== state.favorites.size) {
    state.favorites = new Set(validFavorites);
    persistFavorites();
  }
}

function renderStaticFacts() {
  const categoryCount = state.categories.length;
  const resourceCount = state.resources.length;

  dom.statTotal.textContent = String(resourceCount);
  dom.statCategories.textContent = String(categoryCount);
  dom.statNoteCount.textContent = String(resourceCount);
  dom.lastReviewed.textContent = state.meta.lastReviewed
    ? formatDate(state.meta.lastReviewed, longDateFormatter)
    : "not recorded";
  dom.currentYear.textContent = String(new Date().getFullYear());
  document.title =
    state.view === "saved"
      ? "Saved freebies — Freebie Finder"
      : `${state.meta.title ?? "Freebie Finder"} — Good stuff, actually free`;
}

function renderCategoryFilters() {
  const counts = getCategoryCounts(state.resources);
  const categories = [
    {
      id: ALL_CATEGORIES,
      label: "All freebies",
      count: state.resources.length,
    },
    ...state.categories.map((category) => ({
      ...category,
      count: counts[category.id] ?? 0,
    })),
  ];

  dom.categoryFilters.innerHTML = categories
    .map(
      (category) => `
        <button
          class="category-filter"
          type="button"
          data-category="${escapeHtml(category.id)}"
          aria-pressed="${category.id === state.category}"
        >
          <span class="category-dot" aria-hidden="true"></span>
          <span>${escapeHtml(category.label)}</span>
          <span class="category-count" aria-hidden="true">${category.count}</span>
          <span class="sr-only">, ${category.count} ${pluralize(category.count, "resource")}</span>
        </button>`,
    )
    .join("");
}

function renderTagFilters() {
  const tagCounts = getTagCounts(state.resources);
  const visibleTags = state.tagsExpanded
    ? tagCounts
    : tagCounts.filter(
        ({ tag }, index) => index < TAG_LIMIT || state.tags.has(tag),
      );

  dom.tagFilters.innerHTML = visibleTags
    .map(
      ({ tag, count }) => `
        <button
          class="tag-filter"
          type="button"
          data-tag="${escapeHtml(tag)}"
          aria-pressed="${state.tags.has(tag)}"
          aria-label="${escapeHtml(tag)}, ${count} ${pluralize(count, "resource")}"
        >
          <span class="tag-filter-hash" aria-hidden="true">#</span>
          <span>${escapeHtml(tag)}</span>
          <span class="tag-filter-count" aria-hidden="true">${count}</span>
        </button>`,
    )
    .join("");

  dom.tagExpand.hidden = tagCounts.length <= TAG_LIMIT;
  dom.tagExpand.setAttribute("aria-expanded", String(state.tagsExpanded));
  dom.tagExpand.innerHTML = `${
    state.tagsExpanded ? "Show fewer tags" : "Show all tags"
  } ${ICONS.chevron}`;
}

function renderSummary(visibleResources) {
  const count = visibleResources.length;
  const noun = pluralize(count, "freebie");
  let summary = `<strong>${count}</strong> ${noun} on the shelf.`;

  if (state.view === "saved") {
    summary = isFiltered()
      ? `<strong>${count}</strong> of <strong>${state.favorites.size}</strong> saved ${pluralize(state.favorites.size, "freebie")} ${count === 1 ? "matches" : "match"} your filters.`
      : `<strong>${count}</strong> saved ${noun}. Favorites live in this browser only.`;
  } else if (isFiltered()) {
    summary = `<strong>${count}</strong> ${noun} ${count === 1 ? "matches" : "match"} your filters.`;
  }

  dom.resultsSummary.innerHTML = summary;
}

function renderCards(visibleResources) {
  dom.resourceGrid.setAttribute("aria-busy", "false");

  if (visibleResources.length === 0) {
    dom.resourceGrid.innerHTML = "";
    dom.resourceGrid.hidden = true;
    renderEmptyState();
    return;
  }

  dom.resourceGrid.hidden = false;
  dom.emptyState.hidden = true;
  dom.resourceGrid.innerHTML = visibleResources
    .map((resource) => renderCard(resource))
    .join("");
}

function renderCard(resource) {
  const id = escapeHtml(resource.id);
  const name = escapeHtml(resource.name);
  const categoryLabel = escapeHtml(getCategoryLabel(resource.category));
  const isSaved = state.favorites.has(resource.id);
  const url = escapeHtml(safeUrl(resource.url));
  const verifiedDate = formatDate(resource.lastVerified);
  const verifiedTime = asDate(resource.lastVerified);
  const isAging =
    verifiedTime &&
    Date.now() - verifiedTime.getTime() > AGING_DAYS * 24 * 60 * 60 * 1000;
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const saveAction = isSaved ? "Remove" : "Save";

  return `
    <article
      class="resource-card"
      data-category="${escapeHtml(resource.category)}"
      data-resource-id="${id}"
    >
      <div class="card-top">
        <span class="category-badge">${categoryLabel}</span>
        <button
          class="save-button"
          type="button"
          data-save-id="${id}"
          aria-pressed="${isSaved}"
          aria-label="${saveAction} ${name} ${isSaved ? "from" : "to"} your saved freebies"
        >
          ${ICONS.heart}
          <span>${isSaved ? "Saved" : "Save"}</span>
        </button>
      </div>

      <h3 class="card-title">
        <a href="${url}" target="_blank" rel="noopener noreferrer">
          ${name}${ICONS.external}<span class="sr-only"> (opens in a new tab)</span>
        </a>
      </h3>
      <p class="card-provider">by <span>${escapeHtml(resource.provider)}</span></p>
      <p class="card-description">${escapeHtml(resource.description)}</p>

      <div class="card-tags" aria-label="Tags for ${name}">
        ${tags
          .map(
            (tag) => `
              <button
                class="card-tag"
                type="button"
                data-card-tag="${escapeHtml(tag)}"
                aria-pressed="${state.tags.has(tag)}"
                aria-label="Filter by ${escapeHtml(tag)}"
              >${escapeHtml(tag)}</button>`,
          )
          .join("")}
      </div>

      <div class="free-tier">
        <p class="free-tier-label">${ICONS.spark} The free-tier fine print</p>
        <p>${escapeHtml(resource.freeTierLimits)}</p>
      </div>

      ${
        resource.caveat
          ? `<details class="card-caveat">
              <summary>
                <span>Read the catch</span>
                <span class="caveat-chevron" aria-hidden="true">${ICONS.chevron}</span>
              </summary>
              <p>${escapeHtml(resource.caveat)}</p>
            </details>`
          : ""
      }

      <div class="card-footer">
        <div class="card-meta">
          <span class="verified-date${isAging ? " is-aging" : ""}" title="Last checked ${escapeHtml(verifiedDate)}">
            ${ICONS.clock} Checked ${escapeHtml(verifiedDate)}
          </span>
          <span class="region-label">${ICONS.pin} ${escapeHtml(resource.region)}</span>
        </div>
        <a
          class="visit-button"
          href="${url}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit site${ICONS.external}<span class="sr-only"> ${name} (opens in a new tab)</span>
        </a>
      </div>
    </article>`;
}

function renderEmptyState() {
  let title = "No freebies match that yet.";
  let copy = "Try a broader search, remove a tag, or reset the filters.";
  let action = "Reset filters";
  let actionMode = "reset";

  if (state.view === "saved" && state.favorites.size === 0) {
    title = "No saved freebies yet.";
    copy = "Tap the heart on any listing to keep it close. Your saved shelf stays in this browser.";
    action = "Browse all freebies";
    actionMode = "browse";
  } else if (state.view === "saved" && isFiltered()) {
    title = "No saved freebies match those filters.";
    copy = "Broaden the search or clear the filters to see everything you have saved.";
  }

  dom.emptyTitle.textContent = title;
  dom.emptyCopy.textContent = copy;
  dom.emptyAction.textContent = action;
  dom.emptyAction.dataset.action = actionMode;
  dom.emptyState.hidden = false;
}

function renderActiveFilters() {
  const chips = [];

  if (state.query.trim()) {
    chips.push({
      type: "search",
      label: `Search: “${truncate(state.query.trim())}”`,
      ariaLabel: `Remove search filter for ${state.query.trim()}`,
    });
  }

  if (state.category !== ALL_CATEGORIES) {
    const label = getCategoryLabel(state.category);
    chips.push({
      type: "category",
      label,
      ariaLabel: `Remove ${label} category filter`,
    });
  }

  for (const tag of state.tags) {
    chips.push({
      type: "tag",
      tag,
      label: `#${tag}`,
      ariaLabel: `Remove ${tag} tag filter`,
    });
  }

  if (state.view === "saved") {
    chips.push({
      type: "saved",
      label: "Saved only",
      ariaLabel: "Show all freebies instead of saved freebies",
    });
  }

  dom.activeFilters.hidden = chips.length === 0;
  dom.activeFilters.innerHTML = chips
    .map(
      (chip) => `
        <button
          class="filter-chip"
          type="button"
          data-remove="${chip.type}"
          ${chip.tag ? `data-tag="${escapeHtml(chip.tag)}"` : ""}
          aria-label="${escapeHtml(chip.ariaLabel)}"
        >
          <span>${escapeHtml(chip.label)}</span>
          ${ICONS.close}
        </button>`,
    )
    .join("");
}

function syncControls() {
  const activeCount = getActiveFilterCount();

  if (dom.searchInput.value !== state.query) {
    dom.searchInput.value = state.query;
  }
  dom.searchClear.hidden = !state.query;
  dom.sortSelect.value = state.sort;
  dom.filterCount.textContent = String(activeCount);
  dom.filterCount.hidden = activeCount === 0;
  dom.resetFilters.hidden = !isFiltered() && state.sort === "curated";
  dom.navBrowse.setAttribute("aria-pressed", String(state.view === "browse"));
  dom.navSaved.setAttribute("aria-pressed", String(state.view === "saved"));
  dom.navSavedCount.textContent = String(state.favorites.size);
  dom.navSaved.setAttribute(
    "aria-label",
    `Saved, ${state.favorites.size} ${pluralize(state.favorites.size, "freebie")}`,
  );
}

function render() {
  if (!state.ready) return;

  renderTagFilters();
  const visibleResources = filterResources(state.resources, {
    query: state.query,
    category: state.category,
    tags: [...state.tags],
    favoritesOnly: state.view === "saved",
    favorites: state.favorites,
    sort: state.sort,
  });

  renderCards(visibleResources);
  renderSummary(visibleResources);
  renderActiveFilters();
  syncControls();
  renderSavedButtons();
  writeStateToUrl();
  document.title =
    state.view === "saved"
      ? "Saved freebies — Freebie Finder"
      : `${state.meta.title ?? "Freebie Finder"} — Good stuff, actually free`;
}

function renderSavedButtons() {
  for (const button of dom.resourceGrid.querySelectorAll("[data-save-id]")) {
    const resource = state.resources.find((item) => item.id === button.dataset.saveId);
    const isSaved = state.favorites.has(button.dataset.saveId);
    button.setAttribute("aria-pressed", String(isSaved));
    button.setAttribute(
      "aria-label",
      `${isSaved ? "Remove" : "Save"} ${resource?.name ?? "this freebie"} ${isSaved ? "from" : "to"} your saved freebies`,
    );
    const label = button.querySelector("span");
    if (label) label.textContent = isSaved ? "Saved" : "Save";
  }
}

function focusTagButton(tag) {
  const button = [...dom.tagFilters.querySelectorAll("[data-tag]")].find(
    (candidate) => candidate.dataset.tag === tag,
  );
  if (button) {
    button.focus();
  } else if (!dom.tagExpand.hidden) {
    dom.tagExpand.focus();
  }
}

function focusCategoryButton(category) {
  const button = [...dom.categoryFilters.querySelectorAll("[data-category]")].find(
    (candidate) => candidate.dataset.category === category,
  );
  button?.focus();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  dom.toastMessage.textContent = message;
  dom.toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    dom.toast.hidden = true;
  }, 2800);
}

function setTag(tag, { focusSidebar = true } = {}) {
  if (!state.availableTags.has(tag)) return;
  state.tags = new Set(toggleValue(state.tags, tag));
  render();
  if (focusSidebar) {
    focusTagButton(tag);
  } else {
    focusFirstResult();
  }
}

function focusFirstResult() {
  const firstLink = dom.resourceGrid.querySelector(".card-title a");
  if (firstLink) {
    firstLink.focus();
  } else {
    dom.emptyAction.focus();
  }
}

function setCategory(category) {
  if (
    category !== ALL_CATEGORIES &&
    !state.categoryById.has(category)
  ) {
    return;
  }
  state.category = category;
  render();
  focusCategoryButton(category);
}

function setView(view, { scroll = true } = {}) {
  state.view = view === "saved" ? "saved" : "browse";
  render();

  if (scroll) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dom.browseSection?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }
}

function clearFilters() {
  state.query = "";
  state.category = ALL_CATEGORIES;
  state.tags = new Set();
  state.sort = "curated";
  render();
}

function toggleFavorite(id) {
  const resource = state.resources.find((item) => item.id === id);
  if (!resource) return;

  const wasSaved = state.favorites.has(id);
  if (wasSaved) {
    state.favorites.delete(id);
  } else {
    state.favorites.add(id);
  }
  persistFavorites();

  if (state.view === "saved") {
    render();
    focusFirstResult();
  } else {
    syncControls();
    renderSavedButtons();
  }

  showToast(
    wasSaved
      ? `${resource.name} removed from your saved freebies.`
      : `${resource.name} saved. Find it under Saved.`,
  );
}

function closeMobileFilters({ restoreFocus = false } = {}) {
  dom.filterPanel.classList.remove("is-open");
  dom.filterToggle.setAttribute("aria-expanded", "false");
  if (restoreFocus) dom.filterToggle.focus();
}

function openContributeDialog() {
  if (typeof dom.contributeDialog.showModal === "function") {
    dom.contributeDialog.showModal();
  } else {
    dom.contributeDialog.setAttribute("open", "");
  }
}

function closeContributeDialog() {
  if (typeof dom.contributeDialog.close === "function") {
    dom.contributeDialog.close();
  } else {
    dom.contributeDialog.removeAttribute("open");
  }
}

function bindEvents() {
  dom.searchForm.addEventListener("submit", (event) => event.preventDefault());

  dom.searchInput.addEventListener("input", () => {
    state.query = dom.searchInput.value.slice(0, MAX_QUERY_LENGTH);
    dom.searchClear.hidden = !state.query;
    render();
  });

  dom.searchClear.addEventListener("click", () => {
    state.query = "";
    render();
    dom.searchInput.focus();
  });

  dom.sortSelect.addEventListener("change", () => {
    if (SORT_OPTIONS.includes(dom.sortSelect.value)) {
      state.sort = dom.sortSelect.value;
      render();
    }
  });

  dom.categoryFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    setCategory(button.dataset.category);
  });

  dom.tagFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;
    setTag(button.dataset.tag);
  });

  dom.tagExpand.addEventListener("click", () => {
    state.tagsExpanded = !state.tagsExpanded;
    renderTagFilters();
    dom.tagExpand.focus();
  });

  dom.activeFilters.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-remove]");
    if (!chip) return;

    const type = chip.dataset.remove;
    if (type === "search") {
      state.query = "";
      render();
      dom.searchInput.focus();
      return;
    }
    if (type === "category") {
      state.category = ALL_CATEGORIES;
      render();
      focusCategoryButton(ALL_CATEGORIES);
      return;
    }
    if (type === "saved") {
      state.view = "browse";
      render();
      dom.navBrowse.focus();
      return;
    }
    if (type === "tag" && chip.dataset.tag) {
      setTag(chip.dataset.tag);
    }
  });

  dom.resourceGrid.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-save-id]");
    if (saveButton) {
      toggleFavorite(saveButton.dataset.saveId);
      return;
    }

    const tagButton = event.target.closest("[data-card-tag]");
    if (tagButton) {
      setTag(tagButton.dataset.cardTag, { focusSidebar: false });
    }
  });

  dom.resetFilters.addEventListener("click", () => {
    clearFilters();
    focusFirstResult();
  });

  dom.navBrowse.addEventListener("click", () => setView("browse"));
  dom.navSaved.addEventListener("click", () => setView("saved"));

  dom.emptyAction.addEventListener("click", () => {
    if (dom.emptyAction.dataset.action === "browse") {
      state.view = "browse";
      clearFilters();
      dom.browseSection?.scrollIntoView({ block: "start" });
      focusFirstResult();
      return;
    }
    clearFilters();
    focusFirstResult();
  });

  dom.filterToggle.addEventListener("click", () => {
    const isOpen = !dom.filterPanel.classList.contains("is-open");
    dom.filterPanel.classList.toggle("is-open", isOpen);
    dom.filterToggle.setAttribute("aria-expanded", String(isOpen));
  });

  dom.closeFilters.addEventListener("click", () => {
    closeMobileFilters({ restoreFocus: true });
  });

  dom.retryLoad.addEventListener("click", () => {
    void loadResources();
  });

  for (const button of dom.openContributeButtons) {
    button.addEventListener("click", openContributeDialog);
  }

  for (const button of dom.closeContributeButtons) {
    button.addEventListener("click", closeContributeDialog);
  }

  dom.contributeDialog.addEventListener("click", (event) => {
    if (event.target === dom.contributeDialog) closeContributeDialog();
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping =
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable);

    if (
      event.key === "/" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !isTyping &&
      !dom.contributeDialog.open
    ) {
      event.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
      return;
    }

    if (
      event.key === "Escape" &&
      dom.filterPanel.classList.contains("is-open") &&
      !dom.contributeDialog.open
    ) {
      closeMobileFilters({ restoreFocus: true });
      return;
    }

    if (
      event.key === "Escape" &&
      target === dom.searchInput &&
      dom.searchInput.value
    ) {
      state.query = "";
      render();
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== FAVORITES_KEY) return;
    state.favorites = loadFavorites();
    if (!state.ready) return;
    pruneFavorites();
    render();
  });
}

function init() {
  readStateFromUrl();
  dom.searchInput.value = state.query;
  dom.searchClear.hidden = !state.query;
  dom.sortSelect.value = state.sort;
  dom.currentYear.textContent = String(new Date().getFullYear());
  bindEvents();
  void loadResources();
}

init();
