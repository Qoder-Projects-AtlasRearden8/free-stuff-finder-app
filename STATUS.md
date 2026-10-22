# Freebie Finder — Status

**Build date:** October 22, 2026  
**Latest review:** October 22, 2026  
**State:** Complete, tested locally, and committed locally. No remote, push, or deployment was created.

## What was built

Freebie Finder is a static, GitHub Pages-ready directory of genuinely useful free resources. It is aimed at beginners, authors, small-business owners, nurses, and people looking for practical help without another subscription.

- **58 curated listings** across five categories:
  - AI tools — 12
  - Courses — 15
  - Software & tools — 16
  - Printables & templates — 5
  - Programs & assistance — 10
- **52 unique tags**, plus honest free-tier limits, caveats, regions, and last-verified dates on every listing.
- **Search and filtering:** accent-insensitive full-text search with AND semantics, category filter, stackable tag filters with AND semantics, curated/recent/A–Z sorting, and a Saved view.
- **Shareable state:** search, category, multiple tags, sort, and Saved view are encoded in the URL.
- **Favorites:** stored only in the browser under `freebie-finder:favorites:v1`.
- **Accessibility:** skip link, landmarks, labeled controls, live result announcements, visible focus, `/` search shortcut, Escape behavior, native dialog, mobile filter panel, and reduced-motion support.
- **Local-first privacy:** no analytics, trackers, ads, affiliate links, accounts, API keys, or third-party runtime dependencies.
- **Easy extension:** all content lives in `data/resources.json`, backed by a validator, contribution rules, and a familiar schema.
- **No build step:** the static files are the deliverable. A dependency-free local server is included for development.

The interface uses semantic HTML, one CSS file, and ES modules. Browser QA and the README preview were produced with temporary tooling outside the repository.

## Changes in this review pass

- Fixed a real shareable-link bug: selecting multiple tags previously overwrote all but the last `tag` parameter because the URL builder used `set()` instead of `append()`. URL state is now isolated in `js/url-state.js` and covered by regression tests.
- Included listing caveats in full-text search, matching the page's promise that people can search by the catch or problem they need to solve.
- Added seven resources covering previously thin areas:
  - GitHub Copilot Free (free AI coding)
  - MCP for Beginners (agents and MCP education)
  - Prompt Engineering Guide (prompting education)
  - Open RN (education-only nursing OER)
  - eBay Seller Center (reselling)
  - Lichess (chess)
  - FFXIV Teamcraft (gaming)
- Strengthened the dataset validator to reject inconsistent tag capitalization, untrimmed tags, and common affiliate/tracking query parameters.
- Corrected a KDP limit description so expanded distribution is not incorrectly described as an extra fee.
- Added a verified screenshot to the README and rewrote the README with a quick start, category overview, project layout, field reference, editorial workflow, deployment steps, and troubleshooting.
- Added audience-coverage and URL-state tests. Test count increased from 20 to 27.

## How to run

Requires Node.js 20 or newer. There are no dependencies to install.

```bash
npm start
```

Open <http://127.0.0.1:4173>. To change the port or interface:

```bash
PORT=8080 HOST=0.0.0.0 npm start
```

Verify the project:

```bash
npm run check   # validates data/resources.json
npm test        # dependency-free Node test suite
```

Do not open `index.html` directly with a `file://` URL; the browser must be allowed to fetch the JSON dataset.

## Verification results

- **Dataset validation:** `npm run check` — “Validated 58 resources across 5 categories.”
- **Automated tests:** `npm test` — 27 tests passed, 0 failed.
  - Dataset schema, category coverage, audience coverage, unique IDs and URLs, HTTPS links, date limits, tag consistency, tracking-parameter rejection, and required fields.
  - Accent-insensitive search, caveat search, multi-term behavior, category/tag AND semantics, favorites, sorting, counts, and filter immutability.
  - URL parsing and building, including repeated tags, invalid options, bounds, and round trips.
  - Static server responses, HEAD support, 404/405 handling, and security headers.
  - Local HTML references, unique IDs, tabindex on the skip target, accessible landmarks, noscript fallback, and required attribution.
- **Browser QA:** 15 groups passed in headless Chrome at 1440px and 390px:
  - Initial render of all 58 cards and UTC-safe date formatting
  - Full-text search and URL updates
  - New MCP curriculum discoverability
  - Category plus tag filtering and reset
  - Multiple selected tags preserved in the URL
  - Sorting
  - Favorite persistence across reloads
  - Saved view add/remove/empty states
  - Keyboard shortcuts and Escape behavior
  - Contribution dialog
  - Accessibility scan
  - No console errors or failed requests
  - Mobile filter panel
  - Load-error state and retry
- **Accessibility:** axe-core reported 0 rule violations in the final desktop scan. Keyboard focus and dialog behavior were also exercised. This is automated coverage, not a formal WCAG audit.
- **Responsive layout:** checked at 320, 360, 390, 768, 1024, 1280, and 1440px with no horizontal overflow.
- **Destination audit (October 22, 2026):** all 58 listings use valid public HTTPS URLs. 53 returned HTTP 200 with browser-like requests. The remaining five (Canva, OpenLearn, Lichess, Time and Date, and SCORE) returned Cloudflare “Just a moment…” bot challenges even in headless Chrome; their domains and pages are live, but automated page-content validation was blocked.
- **Repository hygiene:** no secrets, API keys, analytics IDs, or personal data are present in project files. The working tree is clean and commits use the existing local identity only, with no co-author trailers.

## Known gaps and notes

- **Offers change.** Free tiers, eligibility, and regional availability can change without notice. Listings were checked around October 21–22, 2026; there is no automated ongoing monitoring. Confirm current terms with each provider.
- **Some destinations block automation.** Five sites use Cloudflare checks, so automated link checks cannot fully verify their content. A person should recheck those pages before relying on them.
- **Assistance coverage is US-focused.** The assistance category reflects the project’s Indiana/US starting point rather than a global directory. Regions are labeled on each card.
- **Favorites are local only.** Clearing browser data removes them; there is no account sync or backend by design.
- **JavaScript is required for the live directory.** Without JavaScript, the page links directly to the raw JSON dataset instead of rendering searchable cards.
- **Markdown links are plain files on GitHub Pages.** The site links to `CONTRIBUTING.md` and `LICENSE`, which are readable but not rendered as styled HTML pages when hosted. The canonical contributor guidance lives in that Markdown file.
- **Browser QA is not committed.** Puppeteer and axe-core were installed temporarily under `/tmp/freebie-qa` to keep the project dependency-free. Re-running that suite requires Chrome and those temporary packages. The committed test suite needs only Node.
- **No CI or deployment configuration.** Verification is manual/local; no GitHub Actions workflow, remote repository, or Pages deployment exists.
- **Automated accessibility coverage is not a certification.** A zero-violation axe scan catches many issues but is not a complete WCAG audit.
- **Education-only healthcare material.** Open RN and similar listings are learning resources, not medical advice, diagnosis tools, or a substitute for local clinical policy.

## Maintaining the directory

1. Add or edit a listing in `data/resources.json`.
2. Follow the schema in `README.md` and the editorial standards in `CONTRIBUTING.md`.
3. Use an official HTTPS URL, a unique ID, and a real `lastVerified` date.
4. Update `meta.lastReviewed` for a new editorial pass.
5. Run `npm run check` and `npm test`, then preview the card with `npm start`.
