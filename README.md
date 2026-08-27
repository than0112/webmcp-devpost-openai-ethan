# Agent Lost & Found

**Agents search. Humans decide.**

Agent Lost & Found is a WebMCP-enabled civic lost-and-found catalog built for The WebMCP Challenge. People can browse 30 reported items through a responsive interface, while browser agents can use six structured tools to investigate, inspect, compare, explain, and request a claim confirmation.

The structured source of truth is `src/data/items.json`. The matching engine does not use computer vision, an LLM, embeddings, or a backend.

## What works

- Generic natural-language search across all 30 items, plus category filters and item details.
- One active progressive investigation with normalized clues, candidate history, useful facets, and a visible timeline.
- Deterministic weighted ranking with matched, unknown, and contradiction evidence.
- Current imperative WebMCP API through `document.modelContext.registerTool()`.
- Visible Agent Activity for any user-entered query; demo mode stabilizes data and never forces a showcase item.
- Human-only claim confirmation. No WebMCP tool can complete a claim.
- Progressive enhancement: browsers without WebMCP retain the full manual interface.

## WebMCP tools

| Tool | Purpose | State |
| --- | --- | --- |
| `search_lost_items` | Rank the full catalog by natural-language query, structured clues, features, and limit | Read-only |
| `get_item_details` | Return one complete item and highlight it in the gallery | Read-only |
| `get_search_facets` | Recommend up to three useful follow-up clues from the active candidates | Read-only |
| `compare_items` | Rank candidates with positive, unknown, and contradiction evidence | Read-only |
| `get_match_evidence` | Explain one item with the exact score breakdown used for ranking | Read-only |
| `request_claim` | Open the human confirmation UI | Starts UI state only |

There is intentionally no `confirm_claim` tool.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run build
npm run test:sites
```

## Test WebMCP in Chrome

The API is experimental and changes over time. These steps reflect the official Chrome documentation checked on August 27, 2026:

1. Use a Chrome build with WebMCP support.
2. Open `chrome://flags/#enable-webmcp-testing`, enable the flag, and relaunch Chrome.
3. Run the app locally and open it in Chrome, or deploy it to an HTTPS origin.
4. Use Chrome's Model Context Tool Inspector extension or Chrome DevTools WebMCP tooling to inspect the six registered tools.
5. Try “I lost something on a key ring,” ask for a useful facet, then add “It had a small bear charm.” Also try unrelated prompts such as “I lost my brown wallet” or “white wireless earbuds.”
6. Verify the expected top item is highlighted, the score is calculated from matching evidence, and `request_claim` stops at the human confirmation dialog.

For an in-app browser with WebMCP enabled, open the site and use the same prompt. During development, all six page-defined tools were discovered and executed successfully in the ChatGPT/Codex in-app browser.

## Cloudflare Pages

The simplest Pages setup is:

- Build command: `npm run build`
- Output directory: `dist/client`
- Node version: 22 or newer

`public/_headers` adds the origin isolation and permissions headers WebMCP expects. The bundled build also emits a Sites-compatible Worker under `dist/server`.

## Matching model

The engine tokenizes the query, removes conversational stop words, scores every item against the same metadata fields, and sorts deterministically by score and item ID. Each query term receives its strongest matching field weight:

- Exact item name: +40
- Category: +30
- Distinctive feature: +25
- Tag: +20
- Color or location: +15
- Area: +10
- Description keyword: +5

Structured date evidence adds +15. Category, color, location, date, and explicit negative contradictions apply the penalties defined in `SPEC.md`. Scores and normalized confidence are calculated at runtime; there are no item-ID-specific or showcase-query-specific branches.

## Stable demo mode

Open the app with `?demo=true` to keep the 30-item dataset, scoring, session ID, and timeline deterministic. Demo mode does not fill the search box or select a result. The optional Keys Investigation button runs the approved two-round example through the same search, facet, matching, and evidence engines used by every other query.

## Current official references

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP Community Group specification draft](https://webmachinelearning.github.io/webmcp/)
- [WebMCP Community Group repository](https://github.com/webmachinelearning/webmcp)

Because WebMCP remains a proposed standard, implementation code—not the frozen product spec—is the place to track API changes.

## Project status

V2 release verification covers type checking, unit and regression tests, production and Sites builds, responsive browser checks, all six local WebMCP executions, deployed-tool discovery, and the human-only confirmation boundary.

## License

MIT — see [LICENSE](./LICENSE).
