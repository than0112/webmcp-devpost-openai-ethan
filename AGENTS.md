# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Durable product decisions

- Demo mode means a stable, deterministic 30-item dataset; it must never force a fixed yellow-umbrella query.
- Every catalog item must be discoverable through the same generic natural-language search and weighted matching engine. Do not add item-ID-specific or showcase-query-specific branches.
- A user-entered description must be able to run the visible Agent Activity flow, rank candidate results, and highlight the best match. Keep the yellow duck umbrella only as the default example when no query is supplied.
- V2 keeps one visible active investigation per page. The catalog stays primary; the investigation panel supplements it with real candidate, facet, timeline, and evidence engine output.
- Candidate dimming and best-match emphasis must derive from the active session IDs. Reset must restore every card and clear investigation, activity, evidence, claim, and emphasis state.
- Evidence UI may display only matched, unknown, and contradiction values returned by the evidence engine; never invent explanatory metadata.
