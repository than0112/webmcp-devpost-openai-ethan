# Agent Lost & Found V3 — WebMCP Evaluation Guide

**Last updated:** 2026-08-28  
**Automated fixtures:** `src/data/v3-evals.json`

This guide separates deterministic local coverage from browser executions that must be observed manually. Never mark an external run as passed from unit-test evidence alone.

## Automated evaluation

Run:

```powershell
npm test -- --run src/lib/v3-evals.test.ts
```

The pack covers all 30 Traditional Chinese item names, representative English and mixed-language queries, persistence, clue correction, score snapshots, stale case IDs, cancellation, and the human-only claim boundary.

## WebMCP-enabled Chrome procedure

The API is experimental. Recheck the [WebMCP specification](https://webmachinelearning.github.io/webmcp/) and [Chrome imperative API documentation](https://developer.chrome.com/docs/ai/webmcp/imperative-api) before a release recording.

1. Install or open a Chrome build that supports WebMCP.
2. Open `chrome://flags/#enable-webmcp-testing`, enable WebMCP testing, and relaunch Chrome.
3. Open `https://agent-lost-found.pages.dev/?demo=true&present=true`.
4. Open the current Chrome WebMCP tool inspector described by the [Chrome WebMCP evaluation guide](https://developer.chrome.com/docs/ai/webmcp/evals).
5. Confirm exactly seven tools are discovered: `search_lost_items`, `get_item_details`, `get_search_facets`, `compare_items`, `get_match_evidence`, `request_claim`, and `get_active_case`.
6. Run: “I lost my brown wallet at the gym yesterday.” Confirm `search_lost_items` creates a case and returns `case_id`.
7. Add: “It had a snap tab and was not a card holder.” Confirm the same case is continued, LF-013 ranks first, and score/rank changes are explainable.
8. Refresh the page. Run `get_active_case` and confirm the same case ID, clues, candidate count, and best match are returned without replaying activity.
9. Run an unrelated prompt: “I lost my black pen.” Confirm LF-030 ranks first.
10. Run `request_claim` for the best match. Confirm only the review dialog opens; do not click the human confirmation button unless that click is part of the recorded test.
11. Record the observed tool sequence and result in the scorecard below.

## ChatGPT in-app browser procedure

1. Open `https://agent-lost-found.pages.dev/?demo=true&present=true` in a ChatGPT in-app browser with page-defined WebMCP tools enabled.
2. Confirm the browser reports exactly the same seven page tools.
3. Ask: `我昨天在體育館掉了棕色皮夾。`
4. Follow with: `有按扣，而且不是卡套。`
5. Confirm Agent Activity shows only real calls, LF-013 is the best match, and Candidate Movement explains the deterministic change.
6. Refresh, then ask the agent to inspect the active case. Confirm continuity and no fabricated replay.
7. Ask: `Find my black pen.` Confirm LF-030 ranks first through the same generic engine.
8. Ask to request a claim. Confirm the agent stops at human review.
9. Record the actual sequence and status below. If page tools are unavailable, record `Blocked`; do not substitute scripted UI activity.

## Manual scorecard

Status values: `Passed`, `Failed`, `Blocked`, `Not run`.

| Date | Environment | Prompt / check | Expected tool sequence | Actual sequence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-08-28 | Local in-app browser, `127.0.0.1:4174` | Tool discovery after reload | Seven registered tools | Seven tools reported; no `confirm_claim` | Passed | Schemas and annotations were visible in the browser notification. |
| 2026-08-28 | Local in-app browser, `127.0.0.1:4174` | Human Chinese wallet correction via Clue Board | No fabricated agent calls | No agent calls; LF-013 reached 89%; LF-014 removed | Passed | Human UI path, not a WebMCP execution. |
| — | WebMCP-enabled Chrome | Chinese wallet two-round agent flow | search → facets → compare → evidence | — | Not run | Requires external Chrome execution. |
| — | ChatGPT in-app browser | Chinese wallet two-round agent flow | search → facets → compare → evidence | — | Not run | Discovery passed locally; agent execution has not yet been observed. |
| — | WebMCP-enabled Chrome | Refresh and `get_active_case` | get_active_case | — | Not run | Do not infer from persistence unit tests. |
| — | ChatGPT in-app browser | Human-only claim boundary | request_claim, then stop | — | Not run | Do not mark passed until the real review UI is observed from a tool call. |

## Recording rule

For every manual run, record the date, exact browser/build, deployed URL and query parameters, exact prompt, expected sequence, actual sequence, result, and any deviation. A unit test can support diagnosis, but it cannot replace browser evidence.
