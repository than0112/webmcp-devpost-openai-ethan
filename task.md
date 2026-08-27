# Agent Lost & Found — MVP Tasks

## Working rules

- Keep `SPEC.md` v1.1 frozen; put later ideas in `V2_BACKLOG.md`.
- Use `src/data/items.json` as the single structured source of truth.
- Implement against the latest official WebMCP specification and Chrome documentation checked at build time.
- Preserve a fully usable human interface when WebMCP is unavailable.
- Keep the final claim action human-only.
- Make one Git commit after every completed, verified development milestone.

## Milestone 0 — Repository setup

- [x] Initialize Git.
- [x] Commit `SPEC.md` v1.1.
- [x] Commit this task plan.

## Milestone 1 — Foundation and catalog

- [x] Bootstrap React, Vite, and TypeScript.
- [x] Add responsive visual system and item image assets.
- [x] Create all 30 metadata records and validate LF-001 through LF-030 mappings.
- [x] Build header, hero, recently found section, search, filters, gallery, and item details.
- [x] Verify production build and core browsing interactions.

## Milestone 2 — Deterministic search and matching

- [x] Implement structured item search.
- [x] Implement weighted deterministic comparison with matched and missing clues.
- [x] Add automated tests for search, matching, and the LF-003 hero scenario.
- [x] Verify that the score is calculated rather than hardcoded.

## Milestone 3 — WebMCP and agent experience

- [x] Register four tools with the current official `document.modelContext` imperative API.
- [x] Add TypeScript declarations and progressive enhancement fallback.
- [x] Connect tool calls to activity updates, card scrolling, highlighting, and comparison results.
- [x] Add demo mode with a deterministic visible agent walkthrough.
- [x] Verify registration and local tool execution where supported.

## Milestone 4 — Human claim flow

- [x] Make `request_claim` open a confirmation UI without completing a claim.
- [x] Add human-only claim confirmation and success state.
- [x] Verify the agent cannot invoke the final confirmation.

## Milestone 5 — Release and submission readiness

- [x] Add README with architecture, WebMCP sources, Chrome and ChatGPT in-app browser testing steps, demo script, and Cloudflare deployment guidance.
- [x] Add an open-source license and Cloudflare Pages configuration.
- [x] Run type checking, unit tests, production build, interaction checks, and responsive visual QA.
- [x] Record final design QA evidence and remaining external-only checks.

## Milestone 6 — V1.5 generic agent search

- [x] Replace all-token filtering with deterministic weighted ranking across the complete item metadata index.
- [x] Add `features` and ranked evidence to `search_lost_items` without hardcoding showcase queries or item IDs.
- [x] Let any user-entered natural-language description run the visible Agent Activity flow.
- [x] Redefine demo mode as stable dataset state rather than Yellow Umbrella Mode.
- [x] Verify the representative V1.5 prompts and generic retrieval of all 30 catalog items.
- [x] Make production builds reliable without deleting the active OneDrive output directory.

## Official WebMCP baseline checked on 2026-08-27

- Chrome documentation last updated 2026-08-20 uses `document.modelContext.registerTool()`.
- Imperative tool callbacks receive cancellation context as the second argument (`{ signal }`).
- Read-only tools use `annotations.readOnlyHint: true`; stateful initiation uses `false`.
- Local Chrome testing requires `chrome://flags/#enable-webmcp-testing`; Chrome 149+ can use the origin trial.
- WebMCP remains experimental, so the implementation must feature-detect it and keep manual browsing functional.
