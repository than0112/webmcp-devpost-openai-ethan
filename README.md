# Agent Lost & Found V3

**Agents search. Humans decide.**

Agent Lost & Found is a WebMCP-enabled civic lost-and-found catalog built for The WebMCP Challenge. People and browser agents investigate the same 30-item dataset through one deterministic, bilingual matching engine. Cases persist across refreshes, clues can be corrected, ranking changes are explained, and only a human can confirm a claim.

**Live app:** [agent-lost-found.pages.dev](https://agent-lost-found.pages.dev/)

**Judge route:** [stable presenter mode](https://agent-lost-found.pages.dev/?demo=true&present=true)

The structured source of truth is `src/data/items.json`. The matching engine does not use computer vision, embeddings, an LLM, or a backend, and it has no item-ID-specific query branches.

## V3 highlights

- Native English and Traditional Chinese search, catalog metadata, controls, evidence, and case UI.
- Generic discovery for all 30 items in English, Chinese, or mixed-language queries.
- One versioned casefile persisted under the app-owned local-storage key, with safe validation, restoration, and reset.
- An interactive Clue Board for adding, rejecting, correcting, and undoing evidence.
- Deterministic Candidate Movement showing rank direction, exact score delta, and changed evidence.
- Exactly seven current imperative WebMCP tools, including `get_active_case` for refresh/resume continuity.
- Presenter Mode with copyable bilingual prompts and one-click reset; it never changes ranking or scripts an answer.
- A runnable evaluation pack and an honest manual browser scorecard in `docs/WEBMCP_EVALS.md`.
- Human-only claim confirmation. There is deliberately no `confirm_claim` tool.

## V2 versus V3

| Area | V2 | V3 |
| --- | --- | --- |
| Case lifetime | One in-memory investigation | Validated casefile restored after refresh |
| Language | English UI and search | Native English, Traditional Chinese, and mixed input |
| Clues | Progressive agent search | Shared human/agent clues with add, reject, replace, and undo |
| Explanation | Evidence for current result | Evidence plus reproducible rank and score movement |
| WebMCP | Six session-oriented tools | Seven case-oriented tools with V2 ID migration |
| Demo | Stable dataset | Stable dataset plus honest presenter-only layout |
| Evaluation | Unit and browser checks | Language fixtures, workflow coverage, and manual scorecard |

## Architecture

```text
Natural-language description (English / 中文 / mixed)
                  ↓
        WebMCP tools or human UI
                  ↓
        Versioned persistent casefile
                  ↓
  Generic normalization + weighted search
                  ↓
              items.json
                  ↓
     Evidence comparison and snapshots
                  ↓
 Candidate ranking + deterministic movement
                  ↓
      Human-only claim review boundary
```

The React interface and WebMCP tools share the same investigation, matching, persistence, and evidence paths. Browsers without WebMCP retain the complete manual workflow.

## WebMCP tools

| Tool | Purpose | Annotation intent |
| --- | --- | --- |
| `search_lost_items` | Create or continue a named case and rank the full catalog | Stateful |
| `get_item_details` | Return localized metadata and highlight the visible card | Read-only |
| `get_search_facets` | Suggest deterministic follow-up clues for a named case | Read-only |
| `compare_items` | Compare candidates and return score/rank changes | Stateful |
| `get_match_evidence` | Return exact evidence and synchronize the Evidence Card | Stateful UI |
| `request_claim` | Open human review only | Stateful UI |
| `get_active_case` | Return a compact visible/restored case summary | Read-only |

Every input schema is a closed JSON object. Stateful execution checks the WebMCP cancellation signal before committing. Responses that can contain user or catalog text are annotated as untrusted content.

## Judge quick start

1. Open [stable presenter mode](https://agent-lost-found.pages.dev/?demo=true&present=true).
2. Confirm seven tools are discovered in a WebMCP-enabled browser.
3. Start with: `我昨天在體育館掉了棕色皮夾。`
4. Add: `有按扣，而且不是卡套。`
5. Verify LF-013 becomes the strongest result and Candidate Movement explains the change.
6. Refresh and call `get_active_case`; verify the same case resumes without replaying Agent Activity.
7. Try an unrelated prompt: `I lost my black pen.` Verify LF-030 ranks first.
8. Ask to claim the best match. Verify the agent stops at the human confirmation dialog.

The approved English presenter prompt is: `I lost my brown wallet at the gym yesterday. It had a snap tab and was not a card holder.`

## Demo and presenter modes

- `?demo=true` fixes the dataset, case ID, timestamps, and scoring inputs for reproducible evaluation. It does not choose the query or result.
- `?present=true` reduces nonessential navigation, exposes prompt-copy/reset controls, and expands Agent Activity. It does not modify engine data.
- `?demo=true&present=true` combines both behaviors for recording.

## Human safety boundary

`request_claim` may only open the review dialog. A real person must click the confirmation button. WebMCP cannot submit or complete a claim, cancellation is checked before state commits, and no `confirm_claim` tool is registered.

## Local development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test -- --run
npm run build
npm run test:sites
```

The production build must contain:

- `dist/client/index.html`
- `dist/server/index.js`
- `dist/.openai/hosting.json`

## Test WebMCP in Chrome

WebMCP remains experimental. These steps reflect the official documentation checked on August 27, 2026:

1. Use a Chrome build with WebMCP support.
2. Open `chrome://flags/#enable-webmcp-testing`, enable WebMCP testing, and relaunch Chrome.
3. Open the judge route locally or on its HTTPS deployment.
4. Use the current Chrome WebMCP inspector described by the official evaluation documentation.
5. Confirm exactly seven tools and inspect their closed schemas and annotations.
6. Run the Judge quick start above and record actual calls in `docs/WEBMCP_EVALS.md`.

For a ChatGPT in-app browser with page-defined WebMCP enabled, open the same route and prompts. Local in-app-browser discovery of all seven V3 tools passed on August 28, 2026. External agent executions that have not been observed remain explicitly marked `Not run` in the scorecard.

## Matching model

The engine applies Unicode NFKC normalization, longest-first Chinese phrase aliases, Latin case folding, conversational stop-word removal, and deterministic tie-breaking by item ID. Each clue receives only its strongest matching field weight:

- Exact item name: +40
- Category: +30
- Distinctive feature: +25
- Tag: +20
- Color or location: +15
- Area: +10
- Description keyword: +5

Structured date evidence adds +15. Explicit negative contradictions apply the penalties defined in `SPEC.md`.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist/client`
- Node version: 22 or newer

`public/_headers` contains the required origin isolation and permissions headers. The build also emits a Sites-compatible worker under `dist/server`.

## Current official references

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)

Because WebMCP is a draft standard, implementation code and the dated audit in `docs/V3_BASELINE_AUDIT.md` track API changes; the frozen product specification does not hardcode an experimental interface.

## Release status

V3 local verification covers type checking, 156 deterministic unit/evaluation tests, production and Sites builds, bilingual desktop/mobile workflows, persistence, clue correction, rank explanations, presenter-mode parity, seven-tool in-app-browser discovery, and the human-only confirmation boundary. External-only Chrome and agent-execution rows remain honestly recorded in the evaluation scorecard.

## License

MIT — see [LICENSE](./LICENSE).
