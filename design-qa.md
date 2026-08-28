# Design QA — Agent Lost & Found

- Source visual truth: `C:\Users\youho\Downloads\ChatGPT Image 2026年8月27日 下午03_30_53.png`
- Implementation screenshot: `implementation-desktop-final.png`
- Combined comparison evidence: `qa-comparison.png`
- Mobile evidence: `implementation-mobile.png`
- Claim-flow evidence: `implementation-claim.png`
- Viewport: desktop 1280 × 800 CSS px; mobile 390 × 844 CSS px
- Source pixels: 1254 × 1254 at source density
- Desktop screenshot pixels: 1265 × 791, captured at device scale 1 inside the 1280 × 800 browser viewport (scrollbar/chrome excluded by the capture surface)
- Mobile screenshot pixels: 375 × 835 inside the 390 × 844 browser viewport
- Density normalization: source and implementation were independently scaled to 700 px high and placed without cropping in `qa-comparison.png`
- State: homepage, WebMCP registered, Agent Activity idle; claim and success states were tested separately

## Findings

No actionable P0, P1, or P2 findings remain.

The supplied image is an asset catalog rather than a complete page mockup. Asset fidelity was therefore compared directly against the 30-item board, while layout, typography, color, responsive behavior, and interaction states were evaluated against `SPEC.md` v1.1.

## Required fidelity surfaces

- Fonts and typography: the interface uses Inter/system sans for utility copy and Georgia as the permitted editorial display serif. Weight, hierarchy, line height, wrapping, and small-label tracking remain readable at desktop and mobile widths.
- Spacing and layout rhythm: the hero, recent cards, three-step explainer, filters, five-column desktop grid, and two-column mobile grid preserve consistent padding, borders, radii, and vertical rhythm. DOM measurements confirmed no horizontal overflow at the 390 px breakpoint.
- Colors and visual tokens: warm off-white, white cards, deep navy, soft yellow, and muted green follow the frozen visual direction. Contrast remains clear across calls to action and status states.
- Image quality and asset fidelity: all 30 supplied illustrations were extracted into one-to-one LF-001 through LF-030 assets. No emoji, CSS drawings, inline SVG approximations, or generic placeholders replace the supplied product art. LF-003 subject, palette, duck illustration, and wooden curved handle match the source board in the focused hero comparison.
- Copy and content: headline, supporting copy, item IDs and names, locations, dates, agent activity, claim confirmation, and “Agents search. Humans decide.” align with the frozen spec.

## Full-view comparison evidence

`qa-comparison.png` shows the complete supplied asset board and the 1280 × 800 homepage in one normalized image. It confirms the shared warm paper background, ink-like object artwork, LF-003 hero prominence, deep navy typography, and soft yellow accent system.

## Focused region comparison evidence

The LF-003 cell in the source board was compared with the implementation hero. The canopy color, duck illustration, shaft, and curved wooden handle remain intact and correctly scaled. The gallery was also verified to load all 30 individual asset URLs without console errors.

## Interaction and browser evidence

- Search for `duck` reduced the gallery to one item.
- Opening LF-003 displayed its complete item-detail dialog.
- Category filtering and the mobile navigation menu worked.
- The in-app browser discovered all four WebMCP tools.
- All four tools executed successfully in sequence and returned the expected structured results.
- `compare_items` calculated LF-003 at 0.96 with matched and missing clue evidence.
- `request_claim` opened the human confirmation UI; the registered tool list contained no `confirm_claim` tool.
- Human `Confirm claim` produced the success state.
- Browser console warnings/errors checked: none.

## Comparison history

### Pass 1 — blocked

- [P2] At the 1280 px desktop breakpoint, the fixed Agent Activity panel overlapped the Hero “Best match” note.
- Fix: added a desktop-only position adjustment to raise the note above the panel.

### Pass 2 — passed

- Post-fix DOM rectangles confirmed `activityOverlapsBestMatch: false`.
- The revised `implementation-desktop-final.png` and regenerated `qa-comparison.png` show both cards fully readable with no overlap.
- No other actionable P0/P1/P2 difference was visible.

## Follow-up polish

- P3: a production brand font could replace the system fallback if a licensed identity is introduced later; this is outside the frozen MVP.

final result: passed

---

# Design QA — Presenter prompt controls

## Scope

- Source screenshots:
  - `C:\Users\youho\OneDrive\圖片\Screenshots\螢幕擷取畫面 2026-08-28 151648.png` (2848 × 100 px)
  - `C:\Users\youho\OneDrive\圖片\Screenshots\螢幕擷取畫面 2026-08-28 151656.png` (2874 × 1446 px)
- Implementation screenshot: `reports/presenter-prompt-fix-after.png` (1425 × 723 px)
- Combined comparison: `reports/presenter-prompt-fix-comparison.png` (2048 × 2069 px)
- Tested state: Chrome automatic translation active, V3 presenter mode enabled, then both translated English and Chinese prompt buttons clicked.

## Initial finding

- Severity: P0
- Symptom: Clicking either prompt-copy button caused the React application root to disappear, leaving a large blank cream page.
- Browser evidence: Chrome reported `NotFoundError: Failed to execute 'insertBefore' on 'Node'` after automatic translation modified the button DOM.
- Root cause: The click handler changed the icon from Copy to Check and back. React then attempted to reconcile nodes that Chrome translation had already rewritten.

## Fix

- Removed click-driven render-state and icon swapping from the prompt buttons.
- Kept the existing layout, typography, colors, copy, icon library, and clipboard behavior unchanged.
- Isolated clipboard handling in a failure-safe helper and added regression tests for both languages and clipboard rejection.

## Post-fix verification

- English prompt click: React root and `main` remained mounted.
- Chinese prompt click: React root and `main` remained mounted.
- Console errors and warnings after both clicks: none.
- Focused visual comparison: presenter bar remained intact and the complete hero/application layout remained visible after both interactions.
- Typography: unchanged.
- Spacing and layout: restored; no blank-page collapse.
- Colors and borders: unchanged.
- Image quality and visible copy: unchanged.

## Result

passed
