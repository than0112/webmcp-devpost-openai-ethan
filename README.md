# Agent Lost & Found

**Agents search. Humans decide.**

Agent Lost & Found is a WebMCP-enabled civic lost-and-found catalog built for The WebMCP Challenge. People can browse 30 reported items through a responsive interface, while browser agents can use four structured tools to search, inspect, compare, and request a claim confirmation.

The structured source of truth is `src/data/items.json`. The matching engine does not use computer vision, an LLM, embeddings, or a backend.

## What works

- Human search, category filters, responsive 30-item gallery, and item details.
- Deterministic weighted clue matching with explainable matched and missing features.
- Current imperative WebMCP API through `document.modelContext.registerTool()`.
- Visible agent activity, card scrolling and highlight, and `?demo=true`-safe deterministic data.
- Human-only claim confirmation. No WebMCP tool can complete a claim.
- Progressive enhancement: browsers without WebMCP retain the full manual interface.

## WebMCP tools

| Tool | Purpose | State |
| --- | --- | --- |
| `search_lost_items` | Search metadata by query, category, color, location, or date | Read-only |
| `get_item_details` | Return one complete item and highlight it in the gallery | Read-only |
| `compare_items` | Rank candidates with deterministic weighted clues | Read-only |
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
4. Use Chrome's Model Context Tool Inspector extension or Chrome DevTools WebMCP tooling to inspect the four registered tools.
5. Run the hero prompt: “I lost an umbrella yesterday. It was yellow, had a wooden curved handle, and there was a small duck on it.”
6. Verify `LF-003` is highlighted, `compare_items` returns a calculated score of `0.96`, and `request_claim` stops at the human confirmation dialog.

For an in-app browser with WebMCP enabled, open the site and use the same prompt. During development, all four page-defined tools were discovered and executed successfully in the ChatGPT/Codex in-app browser.

## Cloudflare Pages

The simplest Pages setup is:

- Build command: `npm run build`
- Output directory: `dist/client`
- Node version: 22 or newer

`public/_headers` adds the origin isolation and permissions headers WebMCP expects. The bundled build also emits a Sites-compatible Worker under `dist/server`.

## Matching model

- Category: +20
- Color: +20
- Location: +15
- Date: +15
- Each distinctive feature: +15

The earned score is normalized by the applicable evidence. A relative date such as “yesterday” receives 80% of the date weight because it carries less certainty than an exact calendar date; this is what makes the complete LF-003 hero case calculate to `0.96` without hardcoding that result.

## Current official references

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP Community Group specification draft](https://webmachinelearning.github.io/webmcp/)
- [WebMCP Community Group repository](https://github.com/webmachinelearning/webmcp)

Because WebMCP remains a proposed standard, implementation code—not the frozen product spec—is the place to track API changes.

## Project status

Local implementation, unit tests, production build, Sites packaging, in-app WebMCP execution, and the complete human confirmation flow are verified. Publishing a public GitHub repository, deploying to a Cloudflare account, and recording the demo video require project-owner accounts and remain release actions.

## License

MIT — see [LICENSE](./LICENSE).
