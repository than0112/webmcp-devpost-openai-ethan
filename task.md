# Agent Lost & Found — V3 Development Tasks

**Source of truth:** `SPEC.md` V3.0 Approved

**Baseline:** commit `4265b4e`

**Mode:** incremental development; preserve the verified V2 implementation

**Commit rule:** complete and verify exactly one task, update this checklist, then create its listed Git commit before starting the next task.

## Global constraints

- Reuse the existing search, matching, investigation, evidence, UI, and WebMCP paths; do not build parallel V3 engines.
- Keep `src/data/items.json` authoritative and never add query-specific or item-ID-specific result branches.
- Check the current official WebMCP specification and Chrome documentation before changing the browser API integration.
- Keep all agent-facing and submission-facing materials in English. The application may natively support English and Traditional Chinese.
- Preserve a complete manual experience when WebMCP is unavailable.
- `request_claim` may open review state only. Never register `confirm_claim`; only a human click may finish confirmation.
- Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` compatible with Sites.
- Do not push or deploy until Task 12 passes.
- If a P0 requirement or safety rule cannot be implemented as specified, stop before committing and report the deviation.

## Standard verification

Unless a task narrows the scope, its final verification includes:

```powershell
npm run typecheck
npm test -- --run
npm run build
npm run test:sites
```

The task commit is created only after all required checks pass.

---

## Task 0 — Freeze the approved V3 plan

- [x] Mark `SPEC.md` as approved without changing its accepted P0 scope.
- [x] Replace the legacy V1/V2 task plan with this V3 checklist.
- [x] Confirm Git HEAD is the V2 baseline commit `4265b4e`.
- [x] Confirm only the approved planning files are staged for this task.

Acceptance:

- `SPEC.md` says V3 development is approved.
- Every V3 development task has a bounded scope, verification checkpoint, and commit message.
- No application source is changed in this task.

Verify:

```powershell
git rev-parse --short HEAD
git diff --check
git diff --cached --name-only
```

Commit:

```text
plan V3 persistent casefile development
```

---

## Task 1 — Audit and lock the V2 baseline

Spec refs: Sections 2, 19 Phase 0, 22.

- [x] Run the V2 typecheck, 82-test suite, production build, and Sites worker tests.
- [x] Map existing files responsible for search, matching, investigation state, WebMCP registration, claim review, and demo behavior.
- [x] Verify current official API details for `document.modelContext.registerTool`, annotations, registration lifecycle, and execution cancellation.
- [x] Record the audit and official-source date in `docs/V3_BASELINE_AUDIT.md`.
- [x] Record any baseline test-count change honestly instead of preserving a stale number.

Acceptance:

- V2 behavior passes before V3 source changes begin.
- Audit identifies concrete reuse points and confirms no rewrite is needed.
- Official references are limited to the current WebMCP specification and Chrome documentation.

Verify: standard verification plus `git diff --check`.

Commit:

```text
audit the V3 WebMCP baseline
```

---

## Task 2 — Add the versioned casefile domain model

Spec refs: Sections 6, 7, 14, 15.

- [x] Add `SupportedLocale`, `Casefile`, `CaseStep`, `ScoreSnapshot`, status, and validation result types.
- [x] Add deterministic case ID/time helpers that become stable only in Demo Mode.
- [x] Implement complete runtime validation for stored casefiles.
- [x] Reject invalid JSON, unknown versions, malformed clues, invalid steps, and invalid snapshots.
- [x] Rehydrate candidate references from the current catalog and remove missing item IDs safely.
- [x] Enforce query and clue length limits.
- [x] Add focused unit tests for valid, invalid, stale-catalog, and unsupported-locale payloads.

Acceptance:

- No unvalidated value is accepted as a `Casefile`.
- Catalog objects are never copied into storage.
- Unsupported locale falls back to English without losing canonical clues.

Verify: targeted casefile tests, then standard verification.

Commit:

```text
define and validate the V3 casefile
```

---

## Task 3 — Persist, restore, and reset one active case

Spec refs: Sections 4 Persistent Casefile, 7, 15.

- [x] Add storage adapter for `agent-lost-found.casefile.v1`.
- [x] Persist every accepted case mutation and claim-review status change.
- [x] Restore one valid active case at application startup.
- [x] Restore visible case state without appending fake Agent Activity or timeline entries.
- [x] Continue in memory and show a non-blocking notice when storage writes fail.
- [x] Discard only the application-owned key when the payload is invalid.
- [x] Add an explicit reset confirmation that clears case, evidence, claim state, and item highlighting.
- [x] Test refresh-equivalent restoration, corrupted storage, write failure, reset, and no-fabricated-activity behavior.

Acceptance:

- A real investigation survives reload with the same case ID, clues, candidates, evidence history, and status.
- Reset removes only `agent-lost-found.casefile.v1`.

Verify: persistence tests, standard verification, and manual refresh/reset check.

Commit:

```text
persist the active lost item case
```

---

## Task 4 — Build generic bilingual normalization and catalog metadata

Spec refs: Sections 8, 18 Bilingual Search.

- [x] Add Traditional Chinese localized text for all 30 catalog items.
- [x] Add canonical bilingual aliases for categories, colors, features, locations, areas, and common phrases.
- [x] Apply Unicode NFKC normalization, Latin case folding, punctuation/filler removal, and existing English singular/plural handling.
- [x] Implement longest-phrase-first Traditional Chinese matching.
- [x] Merge mixed-language tokens without duplicate scoring.
- [x] Ensure one clue receives only its strongest applicable field weight.
- [x] Keep all logic generic; test that no localized branch keys directly on an item ID.
- [x] Add at least 15 Chinese Top-1, 10 mixed-language, and 30 localized-name discovery tests.

Acceptance:

- The representative Chinese queries in SPEC Section 18 return the expected Top-1 items.
- Existing English search tests remain green.
- English, Chinese, and mixed input use the same ranking engine.

Verify: normalization/search tests, then standard verification.

Commit:

```text
add native bilingual lost item search
```

---

## Task 5 — Localize the primary human interface

Spec refs: Sections 4 Native Languages, 12 Language and Case Header.

- [x] Add typed English and Traditional Chinese message catalogs.
- [x] Add a visible `English / 繁體中文` locale control in the header.
- [x] Localize navigation, hero/search, filters, catalog status, investigation, evidence, errors, demo controls, and claim review.
- [x] Set the document `lang` attribute from the active locale.
- [x] Preserve the active case and canonical clues when locale changes.
- [x] Show case ID, saved/restored status, updated time, and reset action in a responsive Case Header.
- [x] Keep the UI stable when Chrome automatic translation is enabled.

Acceptance:

- A user can switch locales without resetting or rescoring the case.
- Primary workflow has no untranslated blocking control in either locale.
- Mobile does not horizontally scroll.

Verify: standard verification plus manual English, Traditional Chinese, locale-switch, automatic-translation, and mobile checks.

Commit:

```text
localize the persistent case interface
```

---

## Task 6 — Implement atomic clue mutations with undo

Spec refs: Sections 9, 12 Clue Board, 15 No Candidates.

- [x] Implement generic `add`, `reject`, and `replace` clue mutations.
- [x] Normalize clues before duplicate and conflict checks.
- [x] Prevent positive and negative forms of the same canonical clue from remaining active together.
- [x] Make replacement atomic and ensure invalid mutations leave state unchanged.
- [x] Let human corrections override older inferred query clues.
- [x] Add undo-last-mutation using real prior clue state.
- [x] Re-run the same deterministic search/matching pipeline after each accepted mutation.
- [x] Append a real timeline step and score snapshot for every accepted mutation.
- [x] Preserve the case on zero candidates and offer clue correction/removal instead of claim review.
- [x] Add duplicate, conflict, replace, invalid, undo, and zero-result tests.

Acceptance:

- Human UI and engine state use one mutation path.
- The Chinese wallet second-round clues raise LF-013 and weaken LF-014 using metadata, not special cases.

Verify: clue-mutation and investigation tests, then standard verification.

Commit:

```text
add atomic clue correction to casefiles
```

---

## Task 7 — Explain deterministic ranking changes

Spec refs: Sections 10, 12 Candidate Movement.

- [x] Preserve score and breakdown snapshots for every search step.
- [x] Implement `up`, `down`, `same`, `entered`, and `removed` rank movements.
- [x] Calculate exact score delta as current minus previous.
- [x] Keep item-ID ascending tie-breaking.
- [x] Derive changed evidence only from added, removed, or changed breakdown entries.
- [x] Add a Candidate Movement UI that includes text/icons and does not rely only on color.
- [x] Display exact score change and causal evidence without calling it probability or certainty.
- [x] Respect reduced-motion preferences.
- [x] Add complete rank-delta and evidence-diff tests.

Acceptance:

- Every visible movement is reproducible from two engine snapshots.
- Translation changes labels only, never score values or causal meaning.

Verify: rank-delta tests, standard verification, and manual wallet correction check.

Commit:

```text
explain ranking changes from corrected clues
```

---

## Task 8 — Build the interactive Clue Board

Spec refs: Section 12 Clue Board and Mobile.

- [x] Show positive, negative, and unknown clues separately.
- [x] Add accessible controls for add, reject, replace, remove/correct, and undo.
- [x] Disable duplicate or invalid actions and show a concise localized reason.
- [x] Connect controls to the same atomic mutation functions used by agent calls.
- [x] Keep candidate cards readable on desktop and mobile without a permanently reserved side panel.
- [x] Preserve the viewport-safe claim portal and translated-layout fix.
- [x] Add component/integration tests for the principal correction flow.

Acceptance:

- A human can complete both rounds of the Chinese wallet demo without WebMCP.
- Candidate emphasis, Evidence Card, timeline, and saved status update together.

Verify: standard verification plus manual desktop/mobile clue-board and claim-modal checks.

Commit:

```text
build the bilingual clue correction board
```

---

## Task 9 — Upgrade WebMCP to persistent case continuity

Spec refs: Sections 11, 14, 15.

- [ ] Preserve and upgrade the six V2 tools.
- [ ] Add only `get_active_case`, producing exactly seven registered tools.
- [ ] Add optional `case_id` and internal `session_id` migration where required.
- [ ] Reject missing/stale IDs without mutating another case.
- [ ] Use `type: "object"` and `additionalProperties: false` for every schema.
- [ ] Mark truly read-only tools with `readOnlyHint: true`; stateful tools use `false`.
- [ ] Apply `untrustedContentHint` to responses containing user-authored or catalog/external text where supported.
- [ ] Accept the execution callback `{ signal }` and check cancellation before committing state.
- [ ] Keep outputs compact and synchronized with visible React state.
- [ ] Ensure `request_claim` opens human review only and no confirmation tool exists.
- [ ] Add schema, registration, stale-ID, restoration, annotation, cancellation, and claim-safety tests.

Acceptance:

- An agent can discover a restored case, add/correct clues, inspect rank changes, and request review through seven tools.
- Cancellation cannot leave partial case or UI state.

Verify: WebMCP unit tests, standard verification, and local tool discovery/execution where supported.

Commit:

```text
expose persistent case context through WebMCP
```

---

## Task 10 — Add presenter mode without scripted answers

Spec refs: Sections 4 Presenter Mode, 13.

- [ ] Add `?present=true` as a presentation-only display mode.
- [ ] Provide copyable approved English and Traditional Chinese demo prompts.
- [ ] Add compact one-click reset and more readable Agent Activity.
- [ ] Reduce nonessential navigation and stabilize presentation timing/layout.
- [ ] Support `?demo=true&present=true` together.
- [ ] Confirm presenter mode never preselects an item, changes ranking, fabricates calls, or auto-confirms a claim.
- [ ] Add regression tests comparing normal and presenter-mode engine outputs.

Acceptance:

- The presenter can record the real Chinese wallet flow and an unrelated English search.
- The same query produces identical engine results with presenter mode on or off.

Verify: presenter regression tests, standard verification, and manual recording-layout check.

Commit:

```text
add honest V3 presenter mode
```

---

## Task 11 — Add the V3 evaluation pack

Spec refs: Sections 4 Evaluation Pack, 18.

- [ ] Add English, Traditional Chinese, and mixed-language evaluation fixtures.
- [ ] Cover persistence, clue correction, score deltas, stale case IDs, cancellation, and human-only claim safety.
- [ ] Add `docs/WEBMCP_EVALS.md` with exact Chrome and ChatGPT in-app-browser procedures.
- [ ] Add a manual scorecard that records date, environment, prompt, expected tool sequence, actual sequence, result, and notes.
- [ ] Record only observed executions; leave unrun external checks clearly pending.
- [ ] Ensure all 30 localized item names are included in the evaluation coverage.

Acceptance:

- Automated fixtures are deterministic and runnable locally.
- Manual browser evidence distinguishes passed, failed, blocked, and not-run states.

Verify: evaluation tests and standard verification.

Commit:

```text
add V3 WebMCP evaluation coverage
```

---

## Task 12 — Verify, document, deploy, and close V3

Spec refs: Sections 19 Phase 6, 20, 21.

- [ ] Run the complete typecheck, unit, production build, and Sites worker suites.
- [ ] Verify the Chinese wallet flow, refresh/resume, clue correction, rank explanation, and human claim boundary.
- [ ] Verify an unrelated English flow and a mixed-language flow.
- [ ] Verify desktop, mobile, reduced motion, and Chrome automatic translation layouts.
- [ ] Verify seven-tool discovery/execution in WebMCP-enabled Chrome and ChatGPT in-app browser where available.
- [ ] Verify `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json` exist.
- [ ] Update `README.md` with V2-versus-V3 changes, English judge instructions, demo script, architecture, safety boundary, and exact browser setup.
- [ ] Mark every acceptance checkbox only from real evidence.
- [ ] Push `main` and redeploy only after all P0 checks pass.
- [ ] Smoke-test the deployed URL and confirm the worktree is clean.

Acceptance:

- Every P0 acceptance criterion in `SPEC.md` passes or an external-only check is reported honestly before release.
- Deployed behavior matches the verified local build.
- Git history contains one verified commit per completed development task.

Verify:

```powershell
npm run typecheck
npm test -- --run
npm run build
npm run test:sites
git status --short
```

Commit:

```text
verify and document the V3 casefile release
```

---

## Progress log

| Task | Status | Commit | Verification |
| --- | --- | --- | --- |
| 0 | Complete | `plan V3 persistent casefile development` | Baseline `4265b4e`; diff check passed; planning files only |
| 1 | Complete | `audit the V3 WebMCP baseline` | Typecheck; 82 unit tests; production build; 4 Sites tests |
| 2 | Complete | `define and validate the V3 casefile` | Typecheck; 90 unit tests; production build; 4 Sites tests |
| 3 | Complete | `persist the active lost item case` | Typecheck; 94 unit tests; production build; 4 Sites tests; browser refresh/reset check |
| 4 | Complete | `add native bilingual lost item search` | Typecheck; 125 unit tests; production build; 4 Sites tests |
| 5 | Complete | `localize the persistent case interface` | Typecheck; 125 unit tests; production build; 4 Sites tests; bilingual desktop/mobile browser checks |
| 6 | Complete | `add atomic clue correction to casefiles` | Typecheck; 134 unit tests; production build; 4 Sites tests |
| 7 | Complete | `explain ranking changes from corrected clues` | Typecheck; 138 unit tests; production build; 4 Sites tests |
| 8 | Complete | `build the bilingual clue correction board` | Typecheck; 140 unit tests; production build; 4 Sites tests; bilingual wallet correction, refresh, and 375px browser checks |
| 9 | Pending | — | — |
| 10 | Pending | — | — |
| 11 | Pending | — | — |
| 12 | Pending | — | — |
