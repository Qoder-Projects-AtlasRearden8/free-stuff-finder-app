# Freebie Finder

A warm, searchable directory of **genuinely free** tools, courses, software, printables, and assistance programs. Every listing spells out what the free tier includes, where it stops, and when the details were last checked.

Built and maintained by **[Asdale Dynamics, LLC](https://dylanasdale.github.io/)**. The directory is static, private by default, and ready to host on GitHub Pages.

## What is here

- 51 hand-curated listings across five categories
- Full-text search over names, descriptions, tags, limits, and regions
- Category filters plus stackable tag filters
- Curated, recently verified, and A–Z sorting
- Browser-only saved freebies, with no account or server
- Shareable filter URLs and a mobile filter drawer
- Plain-English caveats on every listing, including the last verification date
- No analytics, affiliate links, external fonts, trackers, accounts, or API keys

The five categories are AI tools, courses, software and tools, printables and templates, and programs and assistance.

## Run it locally

Node.js 20 or newer is required. There are no third-party dependencies, so there is nothing to install.

```bash
npm start
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). To use a different port:

```bash
PORT=8080 npm start
```

Open the HTML through this local server rather than double-clicking `index.html`; browsers block the JSON request on `file://` pages.

## Verify the project

```bash
npm test
npm run check
```

`npm test` runs the Node test suite: filtering behavior, dataset quality rules, page reference checks, and local server responses. `npm run check` validates `data/resources.json` by itself and prints a readable list of issues.

## Add a resource

Everything lives in [`data/resources.json`](data/resources.json). Add one object to the `resources` array and run `npm run check`:

```json
{
  "id": "example-resource",
  "name": "Example Resource",
  "provider": "Example Organization",
  "category": "courses",
  "description": "A plain-English explanation of what this actually helps someone do.",
  "freeTierLimits": "What is included for free, plus the meaningful limits and paid extras.",
  "tags": ["Beginners", "Coding", "Free course"],
  "url": "https://example.org/free-course",
  "region": "Global",
  "lastVerified": "2026-10-22",
  "caveat": "The honest catch, privacy note, or eligibility detail someone should know."
}
```

### Data rules

- `id` is a unique lowercase slug.
- `category` must match an `id` in the `categories` array.
- `url` must be a public HTTPS link. No affiliate or referral links.
- `tags` shape the tag filter. Tags use AND matching when more than one is selected.
- `lastVerified` cannot be later than `meta.lastReviewed` or today.
- Descriptions should be warm and concrete. Limits and caveats should be useful, not marketing copy.
- Each category needs at least one resource, and every category needs a label and short blurb.

The UI reads categories, counts, tags, stats, and dates from the JSON, so no JavaScript changes are needed for an ordinary listing. See [CONTRIBUTING.md](CONTRIBUTING.md) for the editorial checklist.

## Deploy to GitHub Pages

This is a no-build static site. All links are relative, and `.nojekyll` is included.

1. Create a GitHub repository and push this folder to its default branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select the default branch and the repository root.
4. Save. GitHub Pages will serve the site at `https://<username>.github.io/<repository>/`.

No GitHub Actions, secrets, environment variables, or server setup are required. Filters and saves work entirely in the browser.

## Privacy and accessibility

Favorites are stored under `freebie-finder:favorites:v1` in the browser's local storage. There is no backend and no data collection. Clearing site data removes saved items.

The app includes keyboard search (`/`), visible focus styles, a skip link, semantic landmarks, reduced-motion support, live result announcements, and responsive layouts. No third-party fonts or scripts are loaded.

Listings are not endorsements, and free offers change. Assistance information is educational and referral-oriented, not legal, medical, tax, or financial advice.

## License

MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Asdale Dynamics, LLC.
