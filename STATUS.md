# Freebie Finder — Status

**Build date:** October 22, 2026  
**State:** Complete, tested locally, and committed locally. Not deployed or published.

## What was built

Freebie Finder is a complete static directory of legitimate free resources for beginners, authors, small-business owners, and people who need practical help. It is ready to host from a GitHub Pages repository with no build step.

- **51 curated resources** across five categories:
  - AI tools — 11
  - Courses — 11
  - Software & tools — 14
  - Printables & templates — 5
  - Programs & assistance — 10
- **43 unique tags**, descriptive metadata, free-tier limits, caveats, regions, and last-verified dates.
- **Search and filtering:** accent-insensitive full-text search with AND semantics, category filter, stackable tag filters with AND semantics, curated/recent/A–Z sorting, and a Saved view.
- **Shareable state:** query, category, tags, sort, and Saved view are reflected in the URL.
- **Favorites:** saved in `localStorage` only; no account or network sync.
- **Accessibility:** skip link, landmarks, labeled controls, live result announcements, visible focus, `/` search shortcut, Escape to clear or close, native dialog, mobile filter drawer, and reduced-motion support.
- **Local-first privacy:** no analytics, trackers, ads, affiliate links, accounts, API keys, or third-party runtime dependencies.
- **Easy extension:** all listings live in `data/resources.json`, with a documented schema, contribution standards, and an automated validator.
- **Project support files:** dependency-free static server, Node test suite, favicon, `.nojekyll`, README, CONTRIBUTING guide, and MIT LICENSE.

The interface uses semantic HTML, one CSS file, and ES modules. There is no build pipeline or runtime dependency.

## How to run

Requires Node.js 20 or newer.

```bash
npm start
```

Open <http://127.0.0.1:4173>. To use another address, set `HOST` or `PORT`:

```bash
PORT=4174 npm start
```

Validate and test:

```bash
npm run check   # validates data/resources.json
npm test        # runs all tests with Node's built-in test runner
```

### GitHub Pages

1. Commit the project at the repository root.
2. Push the intended branch to GitHub.
3. In the repository settings, choose **Pages → Deploy from a branch**, then select the branch and `/ (root)`.
4. No build command is needed. `.nojekyll` is already included and all app paths are relative.

See `README.md` for the full deployment and data-maintenance instructions.

## Verification results

- **Dataset validation:** `npm run check` — “Validated 51 resources across 5 categories.”
- **Automated tests:** `npm test` — 20 tests passed, 0 failed.
  - Dataset schema, category coverage, unique IDs and URLs, HTTPS links, date limits, and required fields.
  - Search normalization and multi-term behavior; category/tag AND semantics; favorites; sorting; counts; filter immutability.
  - Static server responses, HEAD support, 404/405 handling, and security headers.
  - Local HTML references, unique IDs, accessible landmarks, noscript fallback, and required attribution.
- **Browser QA:** 13 interaction groups passed in headless Chrome:
  - Initial render and date formatting
  - Search and URL updates
  - Category plus tag filtering and reset
  - Sorting
  - Favorite persistence across reloads
  - Saved view add/remove/empty states
  - Keyboard shortcuts and Escape behavior
  - Contribution dialog
  - Accessibility scan
  - No console errors or failed requests
  - Mobile layout and filter drawer at 390px
  - Load-error state and retry
- **Accessibility:** axe-core reported 0 rule violations in the final desktop scan. Keyboard focus and dialog behavior were also checked manually. This is automated coverage, not a formal WCAG audit.
- **Responsive layout:** checked at 320, 360, 390, 768, 1024, 1280, and 1440px with no horizontal overflow.
- **Link audit (October 22, 2026):** all 51 destinations point to legitimate public pages. 41 answered directly with HTTP 200; 7 returned bot/Cloudflare 403 challenges; 2 returned a HEAD-only 404 and 1 a HEAD-only 405 but loaded with browser-style GET requests.
- **Repository hygiene:** no secrets, API keys, analytics IDs, or personal data are present in project files. No remote, push, or publication was performed.

## Known gaps and notes

- **Offers change.** Free-tier limits, eligibility, and regional availability can change without notice. Listings were checked around October 21–22, 2026, but there is no ongoing monitoring. Users should confirm terms with each provider.
- **Some sites resist automated checks.** Cloudflare and other bot protections can return 403 responses even when pages are live, so an automated link checker cannot fully validate every destination.
- **Favorites are local only.** Clearing browser data removes them; there is no account sync or backend by design.
- **Browser QA is not committed.** Puppeteer and axe-core were installed temporarily under `/tmp/freebie-qa` to avoid adding runtime or dev dependencies. Re-running that suite requires Chrome and those temporary packages; the committed test suite needs only Node.
- **Port note.** Port 4173 was occupied by an unrelated process in this build environment, so browser QA used port 4174. The default remains 4173.
- **Education-only healthcare listings.** Health-related resources are labeled as education and are not medical advice.
- **Local commit only.** Git history exists in this folder; nothing was pushed to a remote or published.

## Maintaining the directory

1. Add or edit a listing in `data/resources.json`.
2. Follow the schema and standards in `README.md` and `CONTRIBUTING.md`.
3. Use an HTTPS URL, a unique ID, and a real `lastVerified` date.
4. Update `meta.lastReviewed`.
5. Run `npm run check` and `npm test`.
