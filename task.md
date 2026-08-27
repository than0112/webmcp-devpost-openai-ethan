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
- [ ] Commit this task plan.

## Milestone 1 — Foundation and catalog

- [ ] Bootstrap React, Vite, and TypeScript.
- [ ] Add responsive visual system and item image assets.
- [ ] Create all 30 metadata records and validate LF-001 through LF-030 mappings.
- [ ] Build header, hero, recently found section, search, filters, gallery, and item details.
- [ ] Verify production build and core browsing interactions.

## Milestone 2 — Deterministic search and matching

- [ ] Implement structured item search.
- [ ] Implement weighted deterministic comparison with matched and missing clues.
- [ ] Add automated tests for search, matching, and the LF-003 hero scenario.
- [ ] Verify that the score is calculated rather than hardcoded.

## Milestone 3 — WebMCP and agent experience

- [ ] Register four tools with the current official `document.modelContext` imperative API.
- [ ] Add TypeScript declarations and progressive enhancement fallback.
- [ ] Connect tool calls to activity updates, card scrolling, highlighting, and comparison results.
- [ ] Add demo mode with a deterministic visible agent walkthrough.
- [ ] Verify registration and local tool execution where supported.

## Milestone 4 — Human claim flow

- [ ] Make `request_claim` open a confirmation UI without completing a claim.
- [ ] Add human-only claim confirmation and success state.
- [ ] Verify the agent cannot invoke the final confirmation.

## Milestone 5 — Release and submission readiness

- [ ] Add README with architecture, WebMCP sources, Chrome and ChatGPT in-app browser testing steps, demo script, and Cloudflare deployment guidance.
- [ ] Add an open-source license and Cloudflare Pages configuration.
- [ ] Run type checking, unit tests, production build, interaction checks, and responsive visual QA.
- [ ] Record final design QA evidence and remaining external-only checks.

## Official WebMCP baseline checked on 2026-08-27

- Chrome documentation last updated 2026-08-20 uses `document.modelContext.registerTool()`.
- Imperative tool callbacks receive cancellation context as the second argument (`{ signal }`).
- Read-only tools use `annotations.readOnlyHint: true`; stateful initiation uses `false`.
- Local Chrome testing requires `chrome://flags/#enable-webmcp-testing`; Chrome 149+ can use the origin trial.
- WebMCP remains experimental, so the implementation must feature-detect it and keep manual browsing functional.
