# V3 Baseline Audit

**Audit date:** 2026-08-27

**Baseline commit:** `4265b4e` (`fix Chrome translated claim confirmation`)

## Verification result

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test -- --run` | Passed: 8 files, 82 tests |
| `npm run build` | Passed: Vite production client and Sites artifacts created |
| `npm run test:sites` | Passed: 4 tests |

Required Sites output was produced at `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## V2 responsibility map

| Responsibility | Existing implementation to extend |
| --- | --- |
| Application orchestration and shared visible state | `src/App.tsx` |
| Generic item search and weighted ranking | `src/lib/search.ts` |
| Query normalization and aliases | `src/lib/normalize.ts` |
| Evidence-aware comparison | `src/lib/matching.ts` |
| Progressive investigation session and timeline | `src/lib/investigation.ts` |
| Facet discrimination | `src/lib/facets.ts` |
| Evidence presentation data | `src/lib/evidence.ts` |
| Six imperative WebMCP tool definitions | `src/lib/webmcp-tools.ts` |
| React tool registration lifecycle | `src/hooks/useWebMCP.ts` |
| Browser WebMCP TypeScript surface | `src/types/webmcp.d.ts` |
| Human claim boundary | `src/components/ClaimModal.tsx` and `src/App.tsx` |
| Investigation and evidence UI | `src/components/InvestigationPanel.tsx` |
| Visible real tool activity | `src/components/AgentActivity.tsx` |
| Stable V2 demonstration data | `src/lib/demo.ts` |
| Catalog source of truth | `src/data/items.json` |

V3 will extend these paths. It does not require a framework rewrite or a second search/investigation system.

## Official WebMCP API baseline

Checked against the current official sources on 2026-08-27:

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP evals](https://developer.chrome.com/docs/ai/webmcp/evals)

Confirmed implementation contract:

1. Register page tools with asynchronous `document.modelContext.registerTool(tool, options)`.
2. A tool definition includes `name`, `description`, `inputSchema`, `execute`, and optional `annotations`.
3. Use a registration `AbortSignal` to unregister tools when the owning React lifecycle ends.
4. The execute callback receives `{ signal }` as its second argument; stateful implementations must check cancellation before committing changes.
5. Use `annotations.readOnlyHint` to distinguish read-only and state-changing operations.
6. Use `annotations.untrustedContentHint` where a result contains user-authored or externally sourced data.
7. Keep tools same-origin by default; V3 does not require cross-origin exposure.

WebMCP is still a draft Community Group API. The current official specification and tested browser behavior override copied examples if the interface changes during V3 development.

## Baseline decision

The V2 baseline is green and suitable for incremental V3 work. Task 2 may add the versioned casefile domain model without altering current visible behavior.
