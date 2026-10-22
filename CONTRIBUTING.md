# Contributing to Freebie Finder

The goal is a small, trustworthy shelf, not the longest list on the internet. One clearly described free resource is more useful than ten vague links.

## What belongs here

A listing should be:

- **Actually free.** A permanent free tier, full free course, open-source tool, free printable, or real assistance program. Short trials and "free" tools that require a paid plan to do the advertised job do not qualify.
- **Legitimate.** The official provider or a recognized nonprofit, public agency, or open-source project.
- **Honest about limits.** The entry must say where the free tier stops, what needs an account, and what costs money.
- **Safe and respectful.** No cracks, piracy, affiliate links, referral codes, scraped copy, personal data, or tracking links.
- **Checked.** Use the date you confirmed the offer and include the source you used in your pull request.

Healthcare-adjacent resources are welcome only as clearly labeled education, accessibility, or administrative help. Do not submit medical advice, diagnosis tools, or anything that implies a clinical recommendation.

## Add or update a listing

1. Open `data/resources.json`.
2. Add one object to the `resources` array, or update the existing object at its current position.
3. Keep the JSON order curated. New useful entries can go near related resources rather than at the bottom.
4. Run:

   ```bash
   npm run check
   npm test
   ```

5. Preview the app with `npm start`. Search for the new listing and check its card, tags, category count, and link.
6. Update `meta.lastReviewed` if your edit represents a new editorial pass.
7. Open a pull request with a short note and the URL you used to verify the offer.

## Required fields

```json
{
  "id": "unique-lowercase-slug",
  "name": "Resource name",
  "provider": "Organization",
  "category": "ai-tools | courses | software | printables | assistance",
  "description": "What it helps someone do, in plain language.",
  "freeTierLimits": "What is included, what is capped, and what costs extra.",
  "tags": ["At least two", "Useful tags"],
  "url": "https://official-site.example/",
  "region": "Global or a precise region",
  "lastVerified": "YYYY-MM-DD",
  "caveat": "The catch, privacy note, eligibility detail, or sensible warning."
}
```

Keep descriptions readable on a card: roughly 60–600 characters. Do not add HTML; the app treats all JSON text as plain text.

## Categories and tags

The current categories are:

| Category ID | Display name |
| --- | --- |
| `ai-tools` | AI tools |
| `courses` | Courses |
| `software` | Software & tools |
| `printables` | Printables & templates |
| `assistance` | Programs & assistance |

Use existing tags when they fit. Tags are case-sensitive in the data file, so match existing spellings such as `Small business`, `Beginners`, or `United States`. You can introduce a new tag when it genuinely helps someone filter the shelf.

## Review checklist

Before submitting, confirm that:

- The link is the official source and opens without an affiliate redirect.
- Free access does not require a credit card unless that is clearly stated in the limits and caveat.
- Region restrictions and age or eligibility rules are mentioned.
- The verification date is accurate and not in the future.
- No names, email addresses, account details, API keys, or other personal data are included.
- `npm test` and `npm run check` pass.

Maintainers may edit copy for tone, clarity, and accessibility, or decline listings that are misleading, unsafe, or not meaningfully free.

## Accessibility and code changes

- Keep the site dependency-free and compatible with GitHub Pages.
- Use semantic HTML, visible focus states, and plain language.
- Test keyboard navigation and at least one narrow viewport.
- Avoid adding third-party scripts, fonts, trackers, or network calls.
- Do not add analytics or collect personal data.

Questions about the project can be directed to Asdale Dynamics, LLC through [dylanasdale.github.io](https://dylanasdale.github.io/).

By contributing, you agree that your changes are licensed under the project's MIT License.
