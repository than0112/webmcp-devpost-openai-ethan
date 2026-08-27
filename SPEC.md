# Agent Lost & Found — V2 SPEC

**Version:** 2.0 Review Draft

**Codename:** Investigation

**Status:** Development blocked pending user approval

**Target:** The WebMCP Challenge

**Primary Goal:** Multi-step agent investigation over a deterministic 30-item catalog

**Tagline:** Agents investigate. Humans decide.

---

## 1. Approval Gate

This document is the proposed V2 implementation contract.

- Do not begin V2 implementation until the project owner explicitly replies `OK`.
- Reviewing or editing this document does not authorize code changes, commits, pushes, or deployment.
- After approval, implement incrementally. Do not rewrite the existing application from scratch.
- Make one Git commit after each completed and verified development phase.
- Keep the last approved V1.5 commit recoverable through Git history.

---

## 2. Current Baseline — V1.5 Already Complete

V2 starts from the working V1.5 application. The following are existing capabilities, not V2 work:

- React, Vite, and TypeScript application.
- Responsive human browsing interface for 30 catalog items.
- `src/data/items.json` as the single catalog source of truth.
- Generic natural-language search across all 30 items.
- Deterministic weighted ranking with no item-ID-specific search branch.
- Structured search clues: query, category, color, location, date, and features.
- Four registered imperative WebMCP tools using the current official `document.modelContext.registerTool()` API:
  - `search_lost_items`
  - `get_item_details`
  - `compare_items`
  - `request_claim`
- Visible Agent Activity, result highlighting, and human-only claim confirmation.
- Demo behavior that uses the current user query and only falls back to a yellow umbrella example when the query is empty.
- Automated generic search coverage for every catalog item.
- Public GitHub source and Cloudflare Pages deployment.

V2 must preserve these capabilities and must not reimplement them as parallel systems.

---

## 3. Product Definition

V1.5 can rank candidates from a description. V2 must help an agent investigate when the first description is incomplete.

```text
Human description
        ↓
WebMCP agent
        ↓
Search catalog
        ↓
Inspect uncertainty
        ↓
Ask the highest-value question
        ↓
Merge the new clue into the active investigation
        ↓
Search and compare again
        ↓
Explain matched, unknown, and contradictory evidence
        ↓
Recommend a possible match
        ↓
Request human claim confirmation
```

V2 is successful when the page supports a real multi-step investigation instead of replaying a scripted answer.

---

## 4. V2 Scope

### P0 — Required

#### Investigation

- One active in-memory investigation session.
- Progressive clue accumulation.
- Deterministic candidate refinement.
- Candidate count and best-match state.
- Investigation timeline visible in the human UI.
- Session reset on page refresh or explicit reset.

#### Reasoning Support

- Identify which remaining field best separates current candidates.
- Do not suggest questions about clues the user already supplied.
- Return deterministic question hints from templates.
- Handle zero, one, or many candidates safely.

#### Matching and Evidence

- Positive evidence.
- Unknown or unverified evidence.
- Explicit contradictions.
- Negative-clue penalties.
- Match score breakdown.
- Human-readable match strength.
- Evidence explanation for one recommended item.

#### WebMCP

- Upgrade the four existing tools without breaking their core behavior.
- Add exactly two tools:
  - `get_search_facets`
  - `get_match_evidence`
- Keep a maximum of six page-defined WebMCP tools.

#### Safety

- `request_claim` may only open the confirmation UI.
- Do not register `confirm_claim` or any equivalent tool.
- Only a human UI interaction may confirm a claim.

### P1 — Optional After P0

- `?debug=true` score breakdown on candidate cards.
- Minor investigation animation and demo polish.
- Additional synonym coverage beyond the acceptance-test vocabulary.

---

## 5. Non-Goals

V2 must not add:

- Image recognition or a Vision API.
- LLM API calls from the website.
- RAG, embeddings, or a vector database.
- Authentication.
- A database or backend service.
- Real claim submission.
- Maps.
- A chatbot UI.
- Admin tools.
- Payments.
- Local storage or cross-device session persistence.

The browser agent is the intelligence layer. The website provides structured data, deterministic search, investigation support, evidence, and safe actions.

---

## 6. Dataset Contract

`src/data/items.json` remains the source of truth.

Each item supplies:

```ts
interface LostItem {
  id: string;
  name: string;
  category: string;
  color: string[];
  description: string;
  distinctive_features: string[];
  found_location: string;
  found_area: string;
  found_date: string;
  status: "unclaimed" | "claim-pending";
  image: string;
  tags: string[];
}
```

Rules:

- Search, facets, matching, evidence, and UI results must derive from this data.
- No item ID, score, candidate list, or answer may be hardcoded for a demo.
- Do not claim that an item has a feature that is absent from both its metadata and visible asset.
- V2 does not add a fictional bear keychain or library location to LF-007.
- If catalog metadata changes later, update its asset, tests, and demo claims together.

---

## 7. Main V2 Demo — Keys Investigation

The official V2 demo uses existing catalog data without modifying images or inventing features.

### Round 1

Human:

> I lost something on a key ring.

Agent calls `search_lost_items`.

Expected candidates include LF-015 through LF-018.

### Round 2

Agent calls `get_search_facets`.

The tool identifies the attached object or charm shape as a high-value clue and returns a deterministic question hint such as:

> Do you remember what was attached to the ring — a house, bear, heart, or car fob?

Human:

> It had a small bear charm.

Agent calls `search_lost_items` again with the active `session_id`. The clue is merged into the session.

Expected strongest candidate: LF-017 Bear Keychain.

### Evidence and Claim

Agent calls `compare_items`, then `get_match_evidence`.

Expected evidence is derived from LF-017 metadata:

- Key ring or keychain category evidence.
- Bear or teddy-bear feature evidence.
- Brown color evidence when supplied.
- Children's Library location evidence when supplied.
- No invented brand or backpack evidence.

Agent calls `request_claim`.

The website opens the human confirmation UI and stops.

Ending:

> Agents investigate. Humans decide.

The previous yellow duck umbrella remains a valid one-step regression example, not the V2 investigation demo.

---

## 8. Architecture

```text
Human UI ───────────────┐
                       ↓
WebMCP tools ──→ Investigation Session
                       ↓
                Generic Search Engine
                       ↓
                  items.json
                       ↓
                 Candidate Set
                  ↙         ↘
          Facet Engine     Matching Engine
                  ↓             ↓
          Next Question    Ranked Evidence
                                ↓
                         Evidence Engine
                                ↓
                       Human Claim Review
```

Separation rules:

- WebMCP tool handlers orchestrate pure engines; they do not contain scoring logic.
- Human search and WebMCP search reuse the same search engine.
- `compare_items` reuses the same normalized evidence primitives as search.
- `get_match_evidence` formats existing evidence; it does not perform a second unrelated ranking pass.
- React owns the single active session and visible timeline.

---

## 9. Planned File Structure

```text
src/
├── components/
│   ├── InvestigationPanel.tsx   # Session status, timeline, and reset action
│   ├── InvestigationStep.tsx    # One visible investigation event
│   ├── EvidenceCard.tsx         # Match strength and evidence sections
│   └── CandidateBadge.tsx       # Candidate or dimmed state indicator
├── hooks/
│   ├── useInvestigation.ts      # Single active in-memory session reducer
│   └── useWebMCP.ts             # Registers and orchestrates six WebMCP tools
├── lib/
│   ├── normalize.ts             # Tokenization, aliases, singular/plural normalization
│   ├── search.ts                # Generic ranking and candidate retrieval
│   ├── matching.ts              # Positive, unknown, and contradiction scoring
│   ├── facets.ts                # Candidate discrimination and question hints
│   └── evidence.ts              # Evidence explanation and score breakdown shaping
├── data/
│   └── items.json               # Unchanged catalog source of truth
└── types/
    ├── item.ts                  # Catalog, search, and match types
    └── investigation.ts         # Session, clue, step, facet, and evidence types
```

Do not create `lib/webmcp.ts` unless shared tool-registration code actually needs it. Keep the existing registration hook as the primary integration point.

---

## 10. Normalization Contract

Move reusable normalization from `search.ts` into `normalize.ts`.

Required behavior:

- Lowercase and Unicode normalization.
- Punctuation removal.
- Stop-word removal for natural-language queries.
- Token-boundary-aware matching.
- Minimal singular/plural normalization.
- Small, explicit synonym dictionary.
- No external NLP dependency.

Initial synonym groups:

```ts
const SYNONYMS = {
  bag: ["backpack", "handbag", "shoulder bag", "messenger bag", "tote"],
  earbuds: ["airpods", "earphones", "wireless earbuds"],
  bottle: ["water bottle", "thermos"],
  glasses: ["spectacles", "eyeglasses"],
  hat: ["cap", "bucket hat"],
  key: ["keys", "key ring", "keychain"],
};
```

Avoid unrestricted substring matching that creates false relationships such as `water` matching only because an item was found at `Waterfront`.

---

## 11. Search Ranking Contract

Each query term receives its strongest matching field weight. The same term must not collect duplicate points from every field.

| Evidence source | Weight |
| --- | ---: |
| Complete item name present in query | +40 |
| Category | +30 |
| Distinctive feature | +25 |
| Tag | +20 |
| Color | +15 |
| Location | +15 |
| Date | +15 |
| Area | +10 |
| Description keyword | +5 |

Rules:

- Ranking is deterministic.
- Ties resolve by item ID ascending.
- Structured filters and natural-language terms use the same normalized vocabulary.
- Search returns the five strongest results by default.
- The response includes total candidate count but does not send all 30 item records to the agent.
- The full candidate set remains available inside the active investigation session for facet analysis.
- Match score is a deterministic similarity score, not an AI probability.
- Search output includes a compact `score_breakdown` in debug mode only.

---

## 12. Investigation Session

V2 supports one active session per page.

```ts
type InvestigationStatus =
  | "searching"
  | "needs_clue"
  | "possible_match"
  | "confirmation_required"
  | "completed";

interface SearchClue {
  kind: "query" | "category" | "color" | "feature" | "location" | "date" | "negative";
  value: string;
  source: "human" | "agent" | "query";
}

interface SearchStep {
  id: string;
  label: string;
  candidateCount: number;
  candidateIds: string[];
  createdAt: number;
}

interface InvestigationSession {
  id: string;
  originalQuery: string;
  clues: SearchClue[];
  candidateIds: string[];
  searches: SearchStep[];
  bestMatch?: string;
  status: InvestigationStatus;
}
```

Session rules:

- The first search creates a session and returns its ID.
- A later search with that `session_id` merges normalized clues and appends a timeline step.
- Explicit new tool input wins over older conflicting session values.
- Duplicate normalized clues are ignored.
- A missing or stale session ID returns a structured error and does not create hidden state.
- Refresh resets the session.
- Explicit reset clears investigation, activity, candidate emphasis, and claim state.

---

## 13. Facet Engine

`get_search_facets` answers: “What should the agent ask next?”

Candidate fields considered:

- Category.
- Color.
- Canonical distinctive feature.
- Location.
- Area.
- Tag group.

For candidate count `n > 1`:

```ts
discrimination = (uniqueValueCount - 1) / (candidateCount - 1);
coverage = candidatesWithAValue / candidateCount;
facetScore = discrimination * coverage;
```

Classification:

- `facetScore >= 0.70` → high.
- `facetScore >= 0.40` → medium.
- Otherwise → low.

Rules:

- One value shared by all candidates has zero discrimination.
- Exclude clues already present in the session.
- Exclude fields with inadequate coverage.
- Do not treat every free-text feature phrase as a unique high-value facet.
- Canonicalize features before comparing them.
- Return at most three useful clues.
- Use deterministic question templates; the website does not generate prose with an LLM.
- Zero candidates returns recovery guidance.
- One candidate returns no follow-up facet and recommends evidence comparison.

---

## 14. Evidence Semantics

Evidence types have precise meanings:

### Matched

The item metadata confirms a supplied positive clue.

Examples:

- User says `bear`; item has `teddy bear charm`.
- User says `library`; item was found at `Children's Library`.

### Unknown

The clue cannot be verified from available metadata, but the item does not explicitly conflict with it.

Examples:

- User supplies a material detail that is not represented in item metadata.

Do not invent unknown fields such as `brand unknown` unless the catalog formally contains a brand field.

### Contradiction

The item metadata explicitly conflicts with a structured positive clue, or the item contains an explicitly supplied negative clue.

Examples:

- User says `black`; candidate has only `green` color values.
- User says `definitely no laptop sleeve`; candidate metadata contains `laptop sleeve`.

Absence of a free-text feature is unknown, not automatically a contradiction.

---

## 15. Contradiction Penalties

| Contradiction source | Penalty |
| --- | ---: |
| Category | -40 |
| Distinctive feature or explicit negative clue | -30 |
| Color | -20 |
| Location | -15 |
| Date | -15 |

Scoring rules:

1. Calculate positive evidence using the generic field weights.
2. Calculate contradiction penalties once per normalized clue.
3. Subtract penalties from earned evidence.
4. Clamp earned evidence to zero or greater.
5. Normalize against the applicable evidence budget.
6. Clamp the final match score to `0.00…1.00`.
7. Return the positive and negative breakdown used to calculate the score.

The score must never be a hardcoded demo value.

Match strength labels:

- `0.85–1.00` → Strong Match.
- `0.65–0.84` → Possible Match.
- `0.40–0.64` → Weak Match.
- `< 0.40` → Unlikely.

UI wording must say `Match Score`, not `AI certainty` or `probability`.

---

## 16. WebMCP Tool Contracts

All schemas use `type: "object"` and `additionalProperties: false`.

### Tool 01 — `search_lost_items` (Upgrade)

Purpose: create or continue an investigation and return ranked catalog candidates.

```ts
interface SearchLostItemsInput {
  session_id?: string;
  query: string;
  category?: string;
  colors?: string[];
  features?: string[];
  location?: string;
  date?: string;
  negative_clues?: string[];
  limit?: number; // default 5, maximum 10
}
```

```ts
interface SearchLostItemsOutput {
  session_id: string;
  query: string;
  candidate_count: number;
  status: InvestigationStatus;
  results: Array<{
    item_id: string;
    name: string;
    score: number;
    match_strength: string;
    matched_terms: string[];
    matched_fields: string[];
  }>;
}
```

Compatibility decision:

- V2 canonical input is `colors: string[]`.
- During migration, the internal TypeScript adapter may accept the V1.5 `color` string, but only canonical V2 fields appear in the registered schema.

Side effects:

- Updates the active session.
- Updates visible candidates and timeline.
- Does not open a claim.

### Tool 02 — `get_item_details` (Keep Behavior)

```ts
interface GetItemDetailsInput {
  item_id: string;
}
```

Returns complete item metadata and visibly scrolls to and highlights the corresponding card.

### Tool 03 — `get_search_facets` (New)

```ts
interface GetSearchFacetsInput {
  session_id: string;
}
```

```ts
interface GetSearchFacetsOutput {
  session_id: string;
  candidate_count: number;
  status: "needs_clue" | "ready_to_compare" | "no_candidates";
  useful_clues: Array<{
    field: string;
    question_hint: string;
    information_gain: "high" | "medium" | "low";
    score: number;
    example_values: string[];
  }>;
}
```

The tool reads candidates from the named active session. It does not accept arbitrary hidden candidates.

### Tool 04 — `compare_items` (Upgrade)

```ts
interface CompareItemsInput {
  session_id?: string;
  item_ids: string[];
  known_clues?: {
    query?: string;
    category?: string;
    colors?: string[];
    features?: string[];
    location?: string;
    date?: string;
  };
  negative_clues?: string[];
}
```

If `session_id` is supplied, session clues are merged with explicit inputs. Explicit inputs win.

Response:

```ts
interface CompareItemsOutput {
  best_match: MatchEvidenceSummary;
  alternatives: MatchEvidenceSummary[];
}

interface MatchEvidenceSummary {
  item_id: string;
  name: string;
  score: number;
  match_strength: "strong" | "possible" | "weak" | "unlikely";
  matched: string[];
  unknown: string[];
  contradictions: string[];
}
```

### Tool 05 — `get_match_evidence` (New)

Purpose: explain one candidate without performing a separate ranking.

```ts
interface GetMatchEvidenceInput {
  item_id: string;
  session_id?: string;
  known_clues?: CompareItemsInput["known_clues"];
  negative_clues?: string[];
}
```

```ts
interface GetMatchEvidenceOutput {
  item_id: string;
  summary: {
    strength: "strong" | "possible" | "weak" | "unlikely";
    score: number;
  };
  evidence: {
    matched: string[];
    unknown: string[];
    contradictions: string[];
  };
  score_breakdown: Array<{
    clue: string;
    field: string;
    points: number;
    type: "positive" | "contradiction";
  }>;
}
```

Side effects:

- Updates the visible Evidence Card.
- Adds an investigation timeline step.
- Does not open a claim.

### Tool 06 — `request_claim` (Keep)

```ts
interface RequestClaimInput {
  item_id: string;
  session_id?: string;
}
```

Returns:

```ts
{
  status: "confirmation_required";
  item_id: string;
  message: string;
}
```

The tool opens the human confirmation UI. It cannot confirm a claim.

---

## 17. Investigation UI

### Desktop

- Preserve the existing catalog and visual language.
- Add a right-side Investigation Panel approximately `320–380px` wide when investigation state exists.
- Do not turn the application into a dashboard.
- The panel contains:
  - Session status.
  - Timeline.
  - Suggested next clue.
  - Evidence Card.
  - Reset action.

### Mobile

- Render investigation content as an in-page section or bottom sheet below search controls.
- Do not reserve a fixed 320px side panel.
- Keep claim confirmation readable without horizontal scrolling.

### Candidate Visualization

- Current candidates remain at full opacity.
- Non-candidates may use approximately `0.35` opacity only while a session is active.
- The current best match receives border emphasis and a small scale increase.
- Candidate emphasis must derive from session candidate IDs.
- Clearing the session restores all cards.
- Respect reduced-motion preferences.

### Evidence Card

The card displays:

- Item ID and name.
- Match strength.
- Match Score.
- Matched evidence.
- Unknown evidence.
- Contradictions.
- Review Match action.

The card must not display evidence absent from the engine response.

---

## 18. Agent Investigation Timeline

Example:

```text
01  Searching catalog
    4 candidates

02  Looking for useful clues
    Attached charm can separate the candidates

03  Searching again
    Bear charm added · 1 strongest candidate

04  Comparing evidence
    LF-017 · Strong Match

05  Waiting for you
    Human claim confirmation
```

Timeline rules:

- Every entry derives from an actual engine or tool result.
- Do not add fake delays to claim that an agent called a tool it did not call.
- Repeated calls append steps instead of replacing the entire history.
- Reset clears the timeline.

---

## 19. Demo Mode

`?demo=true` means Stable Environment, not Scripted Answer.

Demo Mode controls only:

- Fixed 30-item dataset.
- Deterministic scoring.
- Investigation reset at startup.
- Claim reset at startup.
- Investigation Panel visible.
- No randomness.

Demo Mode must not control:

- Query text.
- Candidate IDs.
- Match score.
- Facet result.
- Evidence result.
- Claim candidate.

The human may enter any supported natural-language description during Demo Mode.

---

## 20. Error and Edge Cases

### Empty Query

- Human UI keeps the agent-search action disabled.
- WebMCP returns a structured validation error.

### No Candidates

- Session status becomes `needs_clue` or a recovery state.
- Facet response recommends broadening or removing a clue.
- No item is highlighted or claimable from that search result.

### One Candidate

- `get_search_facets` returns `ready_to_compare` and no unnecessary question.

### Stale Session

- Return `{ error: "Session not found or expired." }`.
- Do not silently mutate a different session.

### Unknown Item

- Return `{ error: "Item not found." }`.

### WebMCP Unsupported

- Preserve the full human search and browsing interface.
- Investigation engines remain usable through the page UI.

### Tool Registration Failure

- Show manual browsing mode.
- Log a concise development warning without breaking the page.

---

## 21. Testing Requirements

### Search

- At least 15 curated natural-language queries.
- Generic retrieval test covering all 30 item names.
- Structured category, colors, location, date, and feature tests.
- Synonym tests.
- Partial-word false-positive regression tests.
- Default Top-5 and explicit limit tests.
- Determinism test.
- Curated Top-1 accuracy of at least 90%.

Representative queries include:

1. `yellow umbrella duck` → LF-003.
2. `black backpack` → LF-007.
3. `green backpack` → LF-008.
4. `brown wallet` → LF-013.
5. `house keys` → LF-015.
6. `bear keychain` → LF-017.
7. `red heart keychain` → LF-018.
8. `airpods` → LF-019.
9. `round glasses` → LF-021.
10. `blue water bottle` → LF-023.
11. `black cap` → LF-025.
12. `gray scarf` → LF-027.
13. `black gloves` → LF-028.
14. `yellow notebook` → LF-029.
15. `black pen` → LF-030.

`black backpack with bear keychain` is a mixed-clue ambiguity test. It must return relevant candidates based on actual metadata; it must not be asserted as LF-007 with invented bear evidence.

### Facets

- At least 8 facet tests.
- All-shared value produces zero discrimination.
- All-unique values produce high discrimination with full coverage.
- Missing-value coverage reduces facet score.
- Known clues are excluded.
- One candidate returns `ready_to_compare`.
- Zero candidates returns recovery guidance.
- Results are deterministic.

### Matching and Evidence

- At least 10 matching tests.
- At least 5 contradiction tests.
- Positive evidence increases score.
- Explicit negative evidence decreases score.
- Structured field conflict becomes a contradiction.
- Unrepresented free-text evidence becomes unknown.
- Penalties cannot reduce score below zero.
- Evidence explanation uses the same breakdown as ranking.
- Match strength thresholds are tested at boundaries.

### Investigation

- At least 8 reducer or hook tests.
- First search creates a session.
- Follow-up search merges clues.
- Duplicate clues are ignored.
- Explicit new clues override conflicts.
- Timeline appends actual steps.
- Stale IDs fail closed.
- Reset clears all session state.
- Claim state does not survive reset.

### WebMCP and UI Regression

- Six tools register with valid JSON Schemas.
- `get_search_facets` reads the correct session.
- `get_match_evidence` displays the Evidence Card.
- Agent calls visibly update the page.
- `request_claim` still stops at human confirmation.
- No `confirm_claim` tool exists.
- Original yellow umbrella flow remains a valid regression case.
- Production build and Sites worker tests pass.

---

## 22. Development Phases and Commit Boundaries

Development starts only after this SPEC is approved.

### Phase 0 — Baseline Audit

- Verify clean Git state and V1.5 test baseline.
- Map existing search, matching, WebMCP, claim, and demo code to this SPEC.
- Do not remove working features.

No commit unless documentation changes are required.

### Phase 1 — Normalization, Facets, and Evidence Primitives

- Extract reusable normalization.
- Add canonical feature handling.
- Implement facet discrimination.
- Implement evidence classification and score breakdown primitives.
- Add pure unit tests.

Commit message:

```text
add investigation facet and evidence engines
```

### Phase 2 — Contradiction Matching and Session State

- Upgrade matching for positive, unknown, and contradiction evidence.
- Add the single active Investigation Session reducer or hook.
- Add progressive clue merging and timeline state.
- Add matching and session tests.

Commit message:

```text
add progressive investigation state and matching
```

### Phase 3 — WebMCP Investigation Tools

- Upgrade V2 schemas for existing tools.
- Register `get_search_facets`.
- Register `get_match_evidence`.
- Connect tool calls to the active session.
- Verify direct WebMCP execution locally.

Commit message:

```text
expose investigation through WebMCP tools
```

### Phase 4 — Investigation UI

- Add Investigation Panel and timeline.
- Add Evidence Card.
- Add candidate and best-match visualization.
- Add responsive mobile behavior.
- Preserve the existing claim UI.

Commit message:

```text
build investigation timeline and evidence UI
```

### Phase 5 — Demo, Regression, and Release

- Verify Keys Investigation end to end.
- Verify unrelated item searches.
- Run typecheck, unit tests, production build, Sites tests, and browser checks.
- Verify six tools on the deployed page.
- Push and deploy only after all release checks pass.

Commit message:

```text
verify and polish V2 investigation flow
```

---

## 23. V2 Acceptance Criteria

### Search

- [ ] All 30 items remain searchable.
- [ ] No item-specific search or scoring branch exists.
- [ ] Structured and natural-language clues work together.
- [ ] Synonyms and singular/plural forms work for the curated vocabulary.
- [ ] Default Top-5 ranking is deterministic.
- [ ] Mixed clues return honest candidates without invented evidence.

### Investigation

- [ ] First search creates a session.
- [ ] Follow-up clues refine the same session.
- [ ] Candidate count is maintained internally.
- [ ] High-value clues are detected deterministically.
- [ ] Already-known clues are not requested again.
- [ ] Timeline reflects real calls and state transitions.

### Matching and Evidence

- [ ] Positive evidence increases score.
- [ ] Unknown evidence is distinguished from contradiction.
- [ ] Contradictions reduce score.
- [ ] Score breakdown explains the final Match Score.
- [ ] Match strength labels use defined thresholds.
- [ ] Evidence Card never invents metadata.

### WebMCP

- [ ] Exactly six tools register successfully.
- [ ] Search creates or continues an investigation.
- [ ] Facet tool recommends the next useful clue.
- [ ] Compare tool ranks candidates with contradictions.
- [ ] Evidence tool explains one candidate.
- [ ] Claim tool opens human confirmation only.

### Safety

- [ ] No agent-callable claim confirmation exists.
- [ ] Human confirmation remains required.
- [ ] Reset clears claim and investigation state.

### Testing and Release

- [ ] Search, facets, matching, contradiction, session, WebMCP, and regression tests pass.
- [ ] Curated Top-1 accuracy is at least 90%.
- [ ] Typecheck passes.
- [ ] Production build succeeds.
- [ ] Sites worker tests pass.
- [ ] Local in-app WebMCP execution succeeds.
- [ ] Deployed Cloudflare page exposes and executes all six tools.
- [ ] Worktree is clean after the final commit.

---

## 24. V2 Completion Boundary

V2 is complete only when:

1. Multiple unrelated items can be found with natural-language descriptions.
2. An incomplete description can produce multiple candidates.
3. `get_search_facets` recommends a genuinely discriminating question.
4. A follow-up human clue refines the active session.
5. Evidence distinguishes matched, unknown, and contradictory information.
6. The Keys Investigation demo works end to end using real `items.json` metadata.
7. The agent stops at human claim confirmation.

Only after V2 is complete may V3 consider multimodal investigation or image-derived clues.

---

## 25. Official Technical References

Implementation must be checked against the latest official sources at development time:

- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP Community Group repository](https://github.com/webmachinelearning/webmcp)

Because WebMCP remains experimental, current implementation code and official documentation—not copied experimental API examples—are the source of truth for API details.
