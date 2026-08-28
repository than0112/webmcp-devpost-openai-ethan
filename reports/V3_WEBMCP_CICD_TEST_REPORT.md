# Agent Lost & Found V3 — WebMCP and CI/CD Test Report

**Test date:** 2026-08-28

**Production URL:** https://agent-lost-found.pages.dev/?demo=true&present=true

**Source baseline:** `main` at `9b44bfa`

**Validation branch:** `codex/v3-ci-cd-validation` at `157985b`

**Draft PR:** https://github.com/than0112/webmcp-devpost-openai-ethan/pull/1

## Executive result

**Conditional pass.** The application, deterministic evaluation pack, CI gate, CD release gate, build artifacts, deployed manual workflow, and in-app-browser WebMCP discovery passed. Two external execution requirements remain environment-blocked:

1. The connected external Chrome instance is not WebMCP-enabled (`document.modelContext` is unavailable), so page tools cannot be discovered or executed there.
2. The current Codex in-app-browser surface discovers all seven page tools but does not expose those dynamic tools as callable agent functions in this test harness, so a real ChatGPT Agent execution cannot be truthfully marked passed.

The Cloudflare deploy job is also intentionally skipped because the GitHub repository has no Cloudflare secrets or deployment-enable variable. The CD release gate itself passed and produced a verified release artifact.

## Result matrix

| Area | Environment | Result | Evidence |
| --- | --- | --- | --- |
| TypeScript | Windows local, Node project toolchain | Passed | `npm run typecheck` exited successfully. |
| Unit and evaluation suite | Windows local | Passed | 15 files, 156 tests. |
| Production build | Windows local | Passed | Vite build plus Sites packaging completed. |
| Sites worker | Windows local | Passed | 4 passed, 0 failed. |
| Required artifacts | Windows local | Passed | `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json` exist. |
| Deployed manual workflow | External Chrome | Passed | Mixed query `brown 皮夾 snap tab` produced LF-013 and the Clue Board; no console warnings/errors. |
| Chrome automatic translation layout | External Chrome | Passed | Translated controls remained operable and the search completed. |
| WebMCP discovery | ChatGPT/Codex in-app browser | Passed | Exactly seven tools reported; no `confirm_claim`. |
| WebMCP agent execution | ChatGPT/Codex in-app browser | Blocked | Dynamic page tools are reported by the browser but are not callable from this Codex test surface. |
| WebMCP discovery/execution | External Chrome | Blocked | Visible state is “Manual browsing mode”; isolated read confirms no `document.modelContext`. |
| GitHub CI | GitHub-hosted Ubuntu, Node 22 | Passed | Run `33149392262`, job `verify`, 24 seconds. |
| GitHub CD release gate | GitHub-hosted Ubuntu, Node 22 | Passed | Run `33149392312`, job `release-gate`, 31 seconds. |
| CI artifact upload | GitHub Actions | Passed | Verified `dist/` artifact uploaded with seven-day retention. |
| CD release-candidate upload | GitHub Actions | Passed | Verified `dist/client/` artifact uploaded with seven-day retention. |
| Cloudflare deployment from GitHub | GitHub Actions | Skipped / blocked | `CLOUDFLARE_DEPLOY_ENABLED`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_ACCOUNT_ID` are not configured. |

## WebMCP browser evidence

### In-app browser

The deployed production origin reported these seven tools:

1. `search_lost_items`
2. `get_item_details`
3. `get_search_facets`
4. `compare_items`
5. `get_match_evidence`
6. `request_claim`
7. `get_active_case`

The discovery payload showed closed object schemas, stateful/read-only annotations, and `untrustedContentHint: true`. No `confirm_claim` tool was present.

Discovery is a real pass. Tool execution remains blocked because this Codex browser-control surface receives the discovery notification but does not add page-defined tools to its callable tool namespace. Unit/integration tests execute every handler, but that does not substitute for an external ChatGPT Agent run.

### External Chrome

The connected Chrome session loaded the production Presenter Mode successfully, but the page displayed `Manual browsing mode`. A read-only capability check found no `document.modelContext`. This is an environment configuration blocker, not an application failure.

The non-WebMCP fallback was tested under Chrome automatic translation:

- Query: `brown 皮夾 snap tab`
- Expected: LF-013
- Actual: LF-013 with interactive Clue Board
- Console warnings/errors: none

Changing `chrome://flags/#enable-webmcp-testing` is a browser setting and was not changed automatically during this test.

## CI evidence

GitHub Actions CI run: https://github.com/than0112/webmcp-devpost-openai-ethan/actions/runs/33149392262

All steps passed:

- checkout
- Node.js 22 setup with npm cache
- `npm ci`
- `npm run typecheck`
- `npm test -- --run` — 15 files, 156 tests
- `npm run build`
- `npm run test:sites` — 4 passed, 0 failed
- required-file verification
- production artifact upload

## CD evidence

GitHub Actions CD run: https://github.com/than0112/webmcp-devpost-openai-ethan/actions/runs/33149392312

The `release-gate` job passed:

- clean dependency installation
- typecheck
- 156 tests
- production build
- 4 Sites worker tests
- required-file verification
- release-candidate artifact upload

The `deploy` job was skipped by design because `vars.CLOUDFLARE_DEPLOY_ENABLED` is not `true`. No Cloudflare secrets currently exist in the repository. This prevents accidental or unauthenticated production writes while still testing the entire pre-deployment pipeline.

## Required actions for a full external pass

1. In the connected Chrome installation, enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, and rerun the seven-tool sequence.
2. Run the two-round wallet prompt in an actual ChatGPT Agent surface that can invoke page-defined WebMCP tools; record the actual sequence in `docs/WEBMCP_EVALS.md`.
3. Add GitHub repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
4. Set repository variable `CLOUDFLARE_DEPLOY_ENABLED=true` only after the secrets are configured and scoped to the existing `agent-lost-found` Pages project.
5. Rerun CD on `main`, confirm the deploy job passes, and smoke-test the canonical URL.

## Release decision

The code and release candidate are suitable for review and merge. CI and the CD release gate are green. Do not claim that external Chrome WebMCP execution, external ChatGPT Agent execution, or GitHub-driven Cloudflare deployment passed until the environment actions above are completed and observed.
