# SEO Roast Roadmap: www.yneet.in (2026-11-12)

Verdict: The SEO groundwork is already strong. The biggest risk is that one bad deploy could quietly wipe out most of it.

Checked: the prerendered build of `frontend/` served locally (`serve dist`), plus the code. Not checked: live Search Console data, backlinks and the regional hreflang pages. The live site and the data APIs could not be reached from the build sandbox.

## Already in good shape (no action)

- robots.txt allows everything except private paths (`/dashboard`, `/admin`, institute panel). The sitemap is linked. app.yneet.in is noindexed the right way (crawlable and tagged, not disallowed).
- Each page has its own title, description and canonical. A typo URL returns a real 404 status (`/no-such-page-xyz` → 404). Common misspellings of "trial" 301 to `/neet-trial`.
- Prices are plain text in the HTML on `/` and `/courses` (₹299, ₹399, ₹3,199 …), so AI crawlers that don't run JavaScript can read them.
- Sitemap `<lastmod>` uses real content-change dates. IndexNow runs after each deploy.
- Built-in backlink loop already exists: free embeddable widgets (`/neet-question-widget`).

| # | Tier | Issue | Revenue impact | Fix | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | FATAL | If the API can't be reached during a production build, the build still deploys. The sitemap drops from thousands of URLs to about 41, and every practice, paper, question and cutoff page becomes an empty shell. | One unlucky deploy can deindex most of the pages that bring free search traffic, with no alert. | Production builds (when `VITE_YNEET_API_URL` is set) now fail if a data source is down, so Railway keeps the last good deploy live. Fetches retry 3 times. `PRERENDER_ALLOW_PARTIAL=1` overrides. | agent | shipped in PR |
| 2 | REVENUE | No `llms.txt`. AI search engines have no short summary of what YNeet is, what it costs or which pages matter. | ChatGPT and Perplexity have less to go on when students ask them for "best online NEET coaching under ₹500". | `/llms.txt` is now generated at build time from the same titles and descriptions (prices included) as the pages, so it can't drift. | agent | shipped in PR |
| 3 | REVENUE | The `<noscript>` text on every page says "Raise Academy … Please enable JavaScript". | Non-JS crawlers see a different brand from the page, which muddles the YNeet entity. | Reworded to name YNeet (by Raise Academy). | agent | shipped in PR |
| 4 | REVENUE | No `Course`/`Offer` JSON-LD with prices on `/courses`, `/institutes` or `/neet-pyq-books`. The `EducationalOrganization` block has `"sameAs": []`. | No price-rich results. Google and LLMs can't link YNeet to its YouTube and Instagram accounts. | Move plan prices into one exported constant used by Courses.tsx, the meta text and the JSON-LD. Fill `sameAs` with the YNeet YouTube, Instagram and Play Store URLs. | Akbar (send the URLs), then agent | next |
| 5 | REVENUE | `/neet-trial` is indexable (canonical points to itself) but left out of the sitemap. No page body links to it from `/` or `/courses`; the CTAs go to `/register`. | "NEET free trial" searches get no signal pointing to the trial page. | Decide: either list it in the sitemap and link it from `/courses`, or noindex it as an ad-only landing page. Don't leave it half-in. | Akbar (decide) | next |
| 6 | COMPOUNDING | Number of referring domains is unknown. Not measured: no Ahrefs/GSC access here. | The money keywords ("NEET mock test online", "NEET online coaching") need editorial links to reach page 1. | Connect Search Console and export top queries. Run the `directory-submissions` skill for ed-tech and exam-prep directories. Pitch the free widgets to coaching-centre and school sites (brand-anchor links). | Akbar | next |
| 7 | COMPOUNDING | Regional pages (`/ta`, `/hi`, `/te`, `/kn`) and hreflang reciprocity weren't checked (they need the live APIs). | Half-translated or one-way hreflang pages get ignored or treated as thin. | Spot-check 5 live regional URLs: full translation, reciprocal hreflang, `x-default`. | agent (next run, with live access) | next |
| 8 | COMPOUNDING | The main JS bundle is 928 kB (265 kB gzipped). | Slow first interaction on budget Android phones, where most NEET students browse. Hurts Core Web Vitals and conversions. | Code-split the heavy tools (predictor, score calculator, photo resizer) with `React.lazy`. | agent | later |

## Fluff (ignore until rows above ship)

- Large-chunk build warning, minor meta lengths.
