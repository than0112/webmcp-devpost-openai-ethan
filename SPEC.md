# Agent Lost & Found — V3 SPEC

**Version:** 3.0 Approved
**Codename:** Persistent Casefile
**Status:** Approved for incremental development on 2026-08-27
**Target:** The WebMCP Challenge
**Tagline:** Agents investigate. Humans decide.

---

## 1. Approval Gate

- Do not begin V3 implementation until the project owner explicitly approves this SPEC.
- Reviewing or editing this document does not authorize code changes, commits, pushes, or deployment.
- Extend the verified V2 application incrementally; do not rewrite it.
- Complete and verify every development phase before creating its Git commit.
- Stop and report before deviating from an approved P0 requirement or safety boundary.

---

## 2. V2 Baseline

V3 starts from commit `4265b4e` and preserves:

- React, Vite, TypeScript, Cloudflare Pages, and the Sites-compatible build.
- The deterministic 30-item catalog in `src/data/items.json`.
- Generic natural-language search without item-ID-specific result branches.
- Progressive investigation, facets, evidence, contradictions, and timeline.
- Six imperative WebMCP tools using the current official API.
- Visible Agent Activity and candidate highlighting.
- Human-only claim confirmation; no agent-callable confirmation tool.
- Working Chrome and ChatGPT in-app-browser flows.
- The V2 typecheck, 82 unit tests, production build, and Sites worker tests.

V3 must reuse these engines and UI paths instead of creating parallel systems.

---

## 3. Product Definition

V2 supports one investigation until refresh. V3 turns it into a durable, bilingual casefile that can be resumed, corrected, and explained.

```text
English or Traditional Chinese description
                    ↓
           Create or resume case
                    ↓
       Search deterministic catalog
                    ↓
      Ask for a discriminating clue
                    ↓
 Human adds, corrects, or rejects a clue
                    ↓
   Re-rank and explain what changed
                    ↓
       Persist the complete casefile
                    ↓
       Agent requests claim review
                    ↓
          Human confirms or cancels
```

V3 succeeds when a user can begin in either supported language, refresh, resume the same case, correct evidence, and understand every ranking change.

---

## 4. Scope

### P0 — Required

#### Persistent Casefile

- Persist one active case in `localStorage`.
- Restore it after refresh without replaying fake tool calls.
- Store case ID, locale, description, clues, candidates, score history, timeline, best match, and claim-review status.
- Provide explicit reset with confirmation.
- Version and validate the stored payload.

#### Native English and Traditional Chinese

- Add an explicit `English / 繁體中文` language control.
- Localize primary navigation, search, investigation, evidence, claim, error, and demo surfaces.
- Accept English, Traditional Chinese, and mixed-language descriptions.
- Build one generic bilingual index from structured catalog metadata.
- Do not depend on Chrome automatic translation for correctness.

#### Interactive Clue Correction

- Let a human add a positive clue.
- Let a human reject a clue, such as `not black` or `不是雨傘`.
- Let a human replace a conflicting structured clue.
- Append a real timeline step and re-run the deterministic engines after every accepted mutation.
- Human UI and WebMCP calls must update the same case.

#### Ranking Change Explanation

- Preserve previous candidate scores for every search step.
- Show candidates moving up, down, entering, or leaving the candidate set.
- Explain changes using actual positive and contradiction breakdown entries.
- Never call the deterministic score an AI probability or certainty.

#### WebMCP Case Continuity

- Preserve the six V2 tools and add at most one tool: `get_active_case`.
- Upgrade relevant schemas to use `case_id`, with an internal migration adapter for V2 `session_id`.
- Keep responses compact and synchronized with visible state.
- Keep `request_claim` stateful and human-confirmed.

#### Evaluation Pack

- Add English, Traditional Chinese, and mixed-language fixtures.
- Test schemas, case restoration, clue correction, score deltas, and claim safety.
- Add a manual browser-agent scorecard for Chrome and ChatGPT in-app browser.
- Record actual behavior; never fabricate successful calls.

#### Presenter Mode

- Add `?present=true` for recording-focused UI.
- Provide one-click reset, copyable demo prompts, and readable Agent Activity.
- It may stabilize layout and hide nonessential controls.
- It must not force a query, candidate, score, item ID, or claim result.

### P1 — Optional After P0

- Export a case summary as local JSON or a printable report.
- Additional locale aliases.
- Minor motion and recording polish.
- Capability-gated reference-photo attachment stored locally, without automatic recognition.

### Explicitly Deferred

- Vision-model inference.
- Multiple simultaneous cases.
- Authentication, accounts, or cross-device sync.
- Backend database or real claim submission.
- Maps, GPS, notifications, or background monitoring.
- Embeddings, vector databases, RAG, or website-hosted LLM calls.
- Chatbot UI.

---

## 5. Main V3 Demo

### Round 1

Human:

> 我昨天在體育館掉了棕色皮夾。

Expected:

- Create a persistent case.
- Extract wallet, brown, gym, and relative-date clues deterministically.
- Return honest candidates derived from catalog metadata.
- Rank LF-013 strongest when its metadata supplies the best evidence.

### Round 2

Human:

> 有按扣，而且不是卡套。

Expected:

- Add the positive snap-button clue.
- Add the negative card-holder clue.
- Re-run ranking through the same engine.
- Explain why LF-013 rose and LF-014 fell.
- Append a real timeline step.

### Round 3

- Refresh the page.
- Restore case ID, clues, candidates, evidence, and timeline.
- Do not fabricate Agent Activity during restoration.

### Ending

- Agent calls `request_claim`.
- The page opens human confirmation.
- Only a human click completes the demo confirmation.

The V2 Keys Investigation and unrelated English searches remain regression scenarios.

---

## 6. Case Data Contract

```ts
type SupportedLocale = "en" | "zh-TW";

interface Casefile {
  version: 1;
  id: string;
  locale: SupportedLocale;
  originalDescription: string;
  clues: SearchClue[];
  candidateIds: string[];
  bestMatch?: string;
  steps: CaseStep[];
  scoreSnapshots: ScoreSnapshot[];
  status:
    | "searching"
    | "needs_clue"
    | "possible_match"
    | "confirmation_required"
    | "completed";
  claimCandidateId?: string;
  createdAt: number;
  updatedAt: number;
}

interface CaseStep {
  id: string;
  type:
    | "search"
    | "facet"
    | "clue_added"
    | "clue_rejected"
    | "clue_replaced"
    | "compare"
    | "evidence"
    | "claim_requested"
    | "claim_confirmed";
  labelKey: string;
  candidateIds: string[];
  createdAt: number;
}

interface ScoreSnapshot {
  stepId: string;
  scores: Record<string, number>;
  breakdowns: Record<string, ScoreBreakdownEntry[]>;
}
```

Rules:

- Demo Mode may use deterministic IDs and timestamps.
- Catalog metadata remains authoritative.
- Stored item references must be rehydrated from the current catalog.
- Runtime restoration must not manufacture agent activity.

---

## 7. Persistence Contract

Storage key:

```text
agent-lost-found.casefile.v1
```

Behavior:

1. Validate the complete payload before restoration.
2. Reject unknown schema versions.
3. Remove references to missing catalog items.
4. Recalculate derived display data from current metadata.
5. Preserve clues and history only when structurally valid.
6. On failure, start clean and show a recoverable notice.
7. Reset removes only the application-owned case key.

Do not store uploaded images, credentials, browser-agent context, or unrelated user data in P0.

---

## 8. Bilingual Catalog and Normalization

Extend each item with localized searchable metadata:

```ts
interface LocalizedItemText {
  name: string;
  description: string;
  category: string;
  colors: string[];
  distinctive_features: string[];
  found_location: string;
  found_area: string;
  tags: string[];
}

interface LostItem {
  // Existing V2 fields remain canonical.
  localized?: {
    "zh-TW": LocalizedItemText;
  };
}
```

Normalization:

- Unicode NFKC normalization.
- Latin case folding.
- Punctuation and conversational filler removal.
- Existing English singular/plural and synonym handling.
- Explicit Traditional Chinese aliases for categories, colors, features, locations, and common phrases.
- Longest-phrase-first Chinese matching.
- Mixed-language token merging without duplicate scoring.
- Map locale aliases to canonical evidence before scoring.
- Give one clue only its strongest applicable positive weight.

No language, query, or item may trigger an item-ID-specific result branch.

---

## 9. Clue Mutation Contract

```ts
type ClueMutation =
  | { action: "add"; clue: SearchClue }
  | { action: "reject"; clue: SearchClue }
  | { action: "replace"; previous: SearchClue; next: SearchClue };
```

Rules:

- Normalize before equality or conflict checks.
- Ignore exact duplicates.
- Positive and negative forms of the same clue cannot remain active together.
- Replacement is atomic.
- Every mutation produces a search step and score snapshot.
- Invalid mutations return structured errors without partial updates.
- Human corrections override older inferred query clues.

---

## 10. Ranking Delta Contract

```ts
interface RankDelta {
  item_id: string;
  previous_rank?: number;
  current_rank?: number;
  previous_score?: number;
  current_score?: number;
  score_delta: number;
  movement: "up" | "down" | "same" | "entered" | "removed";
  changed_evidence: ScoreBreakdownEntry[];
}
```

Rules:

- Compare normalized engine output, not UI order.
- Tie-breaking remains item ID ascending.
- `changed_evidence` contains only added, removed, or changed breakdown entries.
- Translation may alter labels but not values or causal meaning.
- Compact tool responses may omit zero-delta candidates.

---

## 11. WebMCP Tools

Implementation must be checked against current official WebMCP and Chrome documentation at development time.

All schemas use `type: "object"` and `additionalProperties: false`.

### 01 — `search_lost_items` — Upgrade

- Accept `case_id?`, query, category, colors, features, location, date, negative clues, locale, and limit.
- Create a case when `case_id` is absent.
- Continue only the named case when it is present.
- Return case ID, ranked candidates, status, and compact rank changes.

### 02 — `get_item_details` — Preserve

- Return catalog metadata in the requested locale when available.
- Scroll to and highlight the visible card.

### 03 — `get_search_facets` — Upgrade

- Read candidates from the named case.
- Return localized deterministic question hints.
- Exclude supplied positive and negative clues.

### 04 — `compare_items` — Upgrade

- Merge case clues with explicit inputs.
- Return rank, score, strength, matched, unknown, contradictions, and rank delta.

### 05 — `get_match_evidence` — Upgrade

- Return the exact score breakdown and changed evidence since the previous snapshot.
- Update the visible Evidence Card without changing the score.

### 06 — `request_claim` — Preserve Safety

- Open human review only.
- Use `readOnlyHint: false`.
- Never complete or submit a real claim.
- Never register `confirm_claim`.

### 07 — `get_active_case` — New, Read-only

```ts
interface GetActiveCaseInput {
  case_id?: string;
  locale?: SupportedLocale;
}

interface GetActiveCaseOutput {
  case_id: string;
  status: Casefile["status"];
  locale: SupportedLocale;
  original_description: string;
  clues: SearchClue[];
  candidate_count: number;
  best_match?: string;
  latest_step?: CaseStep;
}
```

Rules:

- Use `readOnlyHint: true`.
- Return only the current visible or restored case.
- Missing or stale IDs return structured errors.
- Do not expose the raw storage payload or browser data.

---

## 12. UI Requirements

### Language

- Locale control is visible in the header.
- Locale changes do not reset the active case.
- Canonical clues remain valid across locale changes.
- Set document language to the selected locale.

### Case Header

- Show case ID, saved status, updated time, and reset.
- Distinguish restored state from new agent activity.

### Clue Board

- Separate positive, negative, and unknown clues.
- Provide add, reject, replace, and undo-last-mutation controls.
- Disable invalid or duplicate actions with a reason.

### Candidate Movement

- Show movement without relying only on color.
- Display exact score change and causal evidence.
- Respect reduced-motion preferences.

### Claim Review

- Preserve the viewport-safe portal.
- Remain stable with Chrome automatic translation.
- Keep human confirmation as the only completion path.

### Mobile

- Render case and clue controls in-page or in sheets.
- Do not reserve a fixed side panel that makes the catalog unreadable.
- Avoid horizontal scrolling.

---

## 13. Presenter Mode

`?present=true` controls presentation only.

Allowed:

- Larger Agent Activity text.
- Copy buttons for approved prompts.
- Compact reset.
- Reduced nonessential navigation.
- Stable animation timing.

Forbidden:

- Preselecting an item.
- Hardcoding candidates or scores.
- Auto-confirming a claim.
- Showing tool calls that did not occur.
- Returning different engine results.

`?demo=true&present=true` may be combined for recording.

---

## 14. Security and Trust

- Tool descriptions contain no unrelated instructions.
- Catalog and user content are data, never agent instructions.
- Use `untrustedContentHint` when the current official API supports it and output contains user-authored or external text.
- Render user text safely; do not inject raw HTML.
- Limit query and clue lengths.
- Validate stored state.
- Store no secrets or credentials.
- Distinguish stateful and read-only tools.
- Cancellation must not commit partial state.

---

## 15. Error and Recovery

### Storage Failure

- Continue in memory and show a non-blocking notice.

### Invalid Stored Case

- Discard only the owned case payload and start clean.

### No Candidates

- Preserve the case and clues.
- Recommend removing or correcting a restrictive clue.
- Do not open claim review.

### Unsupported Locale

- Fall back to English without losing canonical state.

### Stale Case ID

- Return a structured error and do not mutate another case.

### WebMCP Unsupported

- Preserve the complete human search, correction, comparison, and claim-review UI.

---

## 16. Planned File Structure

```text
src/
├── components/
│   ├── CaseHeader.tsx
│   ├── ClueBoard.tsx
│   ├── CandidateMovement.tsx
│   ├── LocaleControl.tsx
│   ├── PresenterControls.tsx
│   └── ClaimModal.tsx
├── data/
│   ├── items.json
│   └── locale-aliases.ts
├── i18n/
│   ├── en.ts
│   └── zh-TW.ts
├── lib/
│   ├── casefile.ts
│   ├── persistence.ts
│   ├── clue-mutations.ts
│   ├── rank-delta.ts
│   ├── normalize.ts
│   ├── search.ts
│   ├── matching.ts
│   ├── facets.ts
│   └── webmcp-tools.ts
├── types/
│   ├── casefile.ts
│   ├── item.ts
│   └── investigation.ts
└── evals/
    ├── prompts.en.json
    ├── prompts.zh-TW.json
    └── prompts.mixed.json

docs/
└── WEBMCP_EVALS.md
```

Reuse existing files when their responsibility already matches; do not duplicate engines to match this proposed tree.

---

## 17. Data Flow

```text
Human or WebMCP input
        ↓
Bilingual normalization
        ↓
Atomic clue mutation
        ↓
Generic search + matching
        ↓
New score snapshot
        ↓
Rank delta calculation
        ↓
Case reducer
   ↙           ↘
UI update    localStorage
        ↓
Visible Agent Activity / Timeline
```

Restoration:

```text
Page load
   ↓
Read versioned payload
   ↓
Validate complete case
   ↓
Rehydrate catalog references
   ↓
Render without fake tool activity
```

---

## 18. Testing Requirements

### Persistence

- Valid case survives reload.
- Invalid JSON and unknown versions fail safely.
- Missing catalog IDs are removed safely.
- Reset removes the stored case.
- Restoration does not append activity.

### Bilingual Search

- At least 15 Traditional Chinese Top-1 queries.
- At least 10 mixed-language queries.
- Existing English tests remain green.
- All 30 localized names are discoverable.
- No localized item-ID-specific search rules.

Representative cases:

1. `黃色小鴨雨傘` → LF-003.
2. `黑色背包` → LF-007.
3. `棕色皮夾` → LF-013.
4. `房屋鑰匙` → LF-015.
5. `小熊鑰匙圈` → LF-017.
6. `白色無線耳機` → LF-019.
7. `圓框眼鏡` → LF-021.
8. `藍色水壺` → LF-023.
9. `灰色圍巾` → LF-027.
10. `黑色原子筆` → LF-030.

### Clue Mutations

- Duplicates are ignored.
- Positive/negative conflict resolves atomically.
- Replacement removes the old clue.
- Invalid mutation leaves state unchanged.
- Undo restores the prior clue state.

### Rank Delta

- Cover up, down, same, entered, and removed.
- Score delta equals current minus previous.
- Changed evidence matches engine changes.
- Ties remain deterministic.

### WebMCP

- Exactly seven tools register when supported.
- Schemas reject extra properties.
- `get_active_case` is read-only.
- Stateful annotations are correct.
- Cancellation cannot commit partial state.
- No `confirm_claim` exists.

### Browser and Release

- Chrome with WebMCP enabled.
- Chrome with automatic translation enabled.
- ChatGPT in-app browser.
- Desktop and mobile responsive checks.
- Typecheck, unit tests, production build, and Sites tests.
- Deployed tool discovery and execution.

---

## 19. Development Phases

Development begins only after explicit SPEC approval.

### Phase 0 — Baseline Audit

- Verify commit `4265b4e`, clean worktree, V2 tests, build, and deployment.
- Map V2 files to this SPEC.
- Confirm the latest official WebMCP API.

No commit unless audit documentation changes.

### Phase 1 — Casefile Persistence

- Add schema, validation, storage, restoration, reset, and tests.

Commit:

```text
persist the active lost item case
```

### Phase 2 — Native Bilingual Search

- Add locale messages, control, Chinese metadata, aliases, normalization, and tests.

Commit:

```text
add native bilingual lost item search
```

### Phase 3 — Clue Correction and Rank Changes

- Add clue mutations, snapshots, rank deltas, Clue Board, Candidate Movement, and tests.

Commit:

```text
explain ranking changes from corrected clues
```

### Phase 4 — WebMCP Case Continuity

- Upgrade schemas, add `get_active_case`, trust annotations, cancellation, and restoration behavior.

Commit:

```text
expose persistent case context through WebMCP
```

### Phase 5 — Evals and Presenter Mode

- Add bilingual fixtures, manual scorecard, presenter UI, and regression verification.

Commit:

```text
add V3 WebMCP evals and presenter mode
```

### Phase 6 — Release Verification

- Run all checks.
- Verify Chrome, translation, in-app browser, responsive layout, and seven deployed tools.
- Update README with V2-versus-V3 work and exact testing instructions.
- Push and deploy only after P0 passes.

Commit:

```text
verify and document the V3 casefile release
```

---

## 20. Acceptance Criteria

### Casefile

- [ ] One case persists across refresh.
- [ ] Invalid storage fails safely.
- [ ] Reset clears case, evidence, claim, highlights, and owned storage.
- [ ] Restoration never fabricates activity.

### Language

- [ ] Primary UI is native English and Traditional Chinese.
- [ ] English, Chinese, and mixed queries share one generic engine.
- [ ] All 30 localized names are discoverable.
- [ ] Correctness does not depend on Chrome translation.

### Investigation

- [ ] Humans can add, reject, replace, and undo clues.
- [ ] Every mutation creates a real timeline step.
- [ ] Rankings update deterministically.
- [ ] Movements are explained by real evidence changes.

### WebMCP

- [ ] Exactly seven tools register against the current API.
- [ ] The agent can read the restored case.
- [ ] Stale case IDs fail closed.
- [ ] Annotations are correct.
- [ ] User and catalog content are treated as data.
- [ ] No agent-callable confirmation exists.

### Demo and Release

- [ ] Chinese wallet demo works end to end.
- [ ] Refresh-and-resume is visible.
- [ ] Unrelated English search still works.
- [ ] Presenter Mode does not alter results.
- [ ] Chrome and in-app browser expose expected tools.
- [ ] Typecheck, tests, build, and Sites tests pass.
- [ ] README distinguishes V2 from V3 work.
- [ ] Worktree is clean after the final commit.

---

## 21. Completion Boundary

V3 is complete only when:

1. A case can start in English or Traditional Chinese.
2. It survives refresh and resumes honestly.
3. A human can correct or reject a clue.
4. Candidate movement is explained by deterministic evidence.
5. The agent can read and continue the restored case through WebMCP.
6. The agent stops at human claim confirmation.
7. Presenter Mode records the real product without scripted answers.
8. The deployed site passes browser and release verification.

Photo-derived clues may be considered for V3.1 only if they can be implemented and demonstrated honestly.

---

## 22. Official References

Check implementation against the latest official sources at development time:

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP repository](https://github.com/webmachinelearning/webmcp)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Chrome DevTools WebMCP](https://developer.chrome.com/docs/devtools/application/webmcp)

WebMCP remains experimental. Current official documentation and verified browser behavior override copied API examples in this frozen product specification.
