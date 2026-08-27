import type { ActivityEntry } from "../components/AgentActivity";
import type { LostItem, SearchInput, SearchResult, UserDescription } from "../types/item";
import type { InvestigationSession, SearchClue } from "../types/investigation";
import { getSearchFacets } from "./facets";
import { createInvestigationSession, createSearchStep, investigationReducer, mergeSearchClues } from "./investigation";
import { compareItemWithClues, compareItemsWithClues, descriptionToClues } from "./matching";
import { rankItems, selectRelevantResults } from "./search";

export interface WebMCPCallbacks {
  onActivity: (entry: ActivityEntry) => void;
  onSearch: (input: SearchInput, results: SearchResult[]) => void;
  onHighlight: (id: string) => void;
  onClaim: (item: LostItem, description?: UserDescription) => void;
  onInvestigation?: (session: InvestigationSession | null) => void;
  onEvidence?: (result: ReturnType<typeof compareItemWithClues>) => void;
}

export interface InvestigationStore {
  get: () => InvestigationSession | null;
  set: (session: InvestigationSession | null) => void;
}

export interface SearchLostItemsInput {
  session_id?: string;
  query: string;
  category?: string;
  colors?: string[];
  color?: string;
  features?: string[];
  location?: string;
  date?: string;
  negative_clues?: string[];
  limit?: number;
}

export interface KnownCluesInput {
  query?: string;
  category?: string;
  colors?: string[];
  features?: string[];
  location?: string;
  date?: string;
}

export interface CompareItemsInput {
  session_id?: string;
  item_ids: string[];
  known_clues?: KnownCluesInput;
  negative_clues?: string[];
}

interface ToolContext { signal?: AbortSignal }
export interface ToolDefinition {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: any, context?: ToolContext) => unknown | Promise<unknown>;
}

const commonSchema = { type: "object", additionalProperties: false } as const;

function cluesFromKnown(known: KnownCluesInput = {}, negatives: string[] = []) {
  return descriptionToClues({ query: known.query, category: known.category, colors: known.colors, features: known.features, location: known.location, date: known.date }, negatives);
}

function cluesFromSearch(input: SearchLostItemsInput): SearchClue[] {
  return descriptionToClues({ query: input.query, category: input.category, colors: input.colors ?? (input.color ? [input.color] : undefined), features: input.features, location: input.location, date: input.date }, input.negative_clues);
}

function descriptionFromClues(clues: SearchClue[]): UserDescription {
  const values = (kind: SearchClue["kind"]) => clues.filter((clue) => clue.kind === kind).map((clue) => clue.value);
  return { query: values("query").join(" "), category: values("category").at(-1), colors: values("color"), features: values("feature"), location: values("location").at(-1), date: values("date").at(-1) };
}

function staleSessionError(sessionId: string) {
  return { error: { code: "invalid_session", message: `Session ${sessionId} is missing or stale.` } };
}

function requireSession(store: InvestigationStore, sessionId: string) {
  const session = store.get();
  return session?.id === sessionId ? session : null;
}

function publishSession(store: InvestigationStore, callbacks: WebMCPCallbacks, session: InvestigationSession | null) {
  store.set(session);
  callbacks.onInvestigation?.(session);
}

function matchShape(result: ReturnType<typeof compareItemWithClues>) {
  return { item_id: result.item.id, name: result.item.name, score: result.score, match_strength: result.match_strength, matched: result.matched, unknown: result.unknown, contradictions: result.contradictions };
}

export function createWebMCPTools(items: LostItem[], callbacks: WebMCPCallbacks, store: InvestigationStore, runtime: { createId?: () => string; now?: () => number } = {}): ToolDefinition[] {
  const createId = runtime.createId ?? (() => crypto.randomUUID());
  const now = runtime.now ?? (() => Date.now());
  return [
    {
      name: "search_lost_items", title: "Search lost items",
      description: "Create or continue a lost-item investigation from natural-language and structured clues. Returns deterministic ranked candidates and a session ID.",
      inputSchema: { ...commonSchema, properties: { session_id: { type: "string" }, query: { type: "string", minLength: 1 }, category: { type: "string" }, colors: { type: "array", items: { type: "string" } }, features: { type: "array", items: { type: "string" } }, location: { type: "string" }, date: { type: "string" }, negative_clues: { type: "array", items: { type: "string" } }, limit: { type: "integer", minimum: 1, maximum: 10, default: 5 } }, required: ["query"] },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input: SearchLostItemsInput, context) => {
        context?.signal?.throwIfAborted();
        const incoming = cluesFromSearch(input);
        const current = input.session_id ? requireSession(store, input.session_id) : null;
        if (input.session_id && !current) return staleSessionError(input.session_id);
        const clues = current ? mergeSearchClues(current.clues, incoming) : incoming;
        const description = descriptionFromClues(clues);
        const searchInput: SearchInput = { query: [description.query, ...(description.colors ?? []), ...(description.features ?? [])].filter(Boolean).join(" "), category: description.category, location: description.location, date: description.date };
        const sourceItems = current ? items.filter((item) => current.candidateIds.includes(item.id)) : items;
        const ranked = selectRelevantResults(rankItems(sourceItems, searchInput, { strictFilters: false }));
        const limit = Math.max(1, Math.min(10, input.limit ?? 5));
        const candidateIds = ranked.map((result) => result.item.id);
        const session = current
          ? investigationReducer(current, { type: "search", sessionId: current.id, clues: incoming, candidateIds, label: input.query, createdAt: now() })!
          : createInvestigationSession({ id: createId(), originalQuery: input.query, clues, candidateIds, createdAt: now() });
        publishSession(store, callbacks, session);
        callbacks.onSearch(searchInput, ranked.slice(0, limit));
        callbacks.onActivity({ tool: "search_lost_items", message: `Ranked ${ranked.length} candidate${ranked.length === 1 ? "" : "s"}`, state: "done" });
        return { session_id: session.id, query: input.query, candidate_count: ranked.length, status: session.status, results: ranked.slice(0, limit).map((result) => ({ item_id: result.item.id, name: result.item.name, score: result.confidence, match_strength: result.confidence >= 0.85 ? "strong" : result.confidence >= 0.65 ? "possible" : result.confidence >= 0.4 ? "weak" : "unlikely", matched_terms: result.matched_terms, matched_fields: result.matched_fields })) };
      },
    },
    {
      name: "get_item_details", title: "Get item details", description: "Retrieve complete structured metadata for one catalog item and bring its card into view.",
      inputSchema: { ...commonSchema, properties: { item_id: { type: "string", pattern: "^LF-[0-9]{3}$" } }, required: ["item_id"] }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: ({ item_id }: { item_id: string }, context) => { context?.signal?.throwIfAborted(); const item = items.find((candidate) => candidate.id === item_id); if (!item) return { error: { code: "item_not_found", message: "Item not found." } }; callbacks.onHighlight(item.id); callbacks.onActivity({ tool: "get_item_details", message: `Inspecting ${item.id}`, state: "done" }); return item; },
    },
    {
      name: "get_search_facets", title: "Get useful search clues", description: "Analyze the active investigation candidates and suggest up to three deterministic, discriminating follow-up questions.",
      inputSchema: { ...commonSchema, properties: { session_id: { type: "string" } }, required: ["session_id"] }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: ({ session_id }: { session_id: string }, context) => { context?.signal?.throwIfAborted(); const session = requireSession(store, session_id); if (!session) return staleSessionError(session_id); const candidates = session.candidateIds.map((id) => items.find((item) => item.id === id)).filter((item): item is LostItem => Boolean(item)); const useful = getSearchFacets(candidates, session.clues); const status = candidates.length === 0 ? "no_candidates" : candidates.length === 1 ? "ready_to_compare" : "needs_clue"; const label = candidates.length === 0 ? "No candidates · broaden the search" : useful[0] ? `Useful clue · ${useful[0].field}` : "Ready to compare evidence"; publishSession(store, callbacks, { ...session, searches: [...session.searches, createSearchStep(label, session.candidateIds, now())] }); callbacks.onActivity({ tool: "get_search_facets", message: candidates.length ? `${useful.length} useful clue${useful.length === 1 ? "" : "s"}` : "Broaden or remove a clue", state: "done" }); return { session_id, candidate_count: candidates.length, status, useful_clues: useful, ...(candidates.length === 0 ? { recovery_guidance: "Broaden the search or remove a restrictive clue." } : {}) }; },
    },
    {
      name: "compare_items", title: "Compare lost items", description: "Rank named candidates using positive, unknown, and contradiction evidence from an active investigation or explicit clues.",
      inputSchema: { ...commonSchema, properties: { session_id: { type: "string" }, item_ids: { type: "array", items: { type: "string", pattern: "^LF-[0-9]{3}$" }, minItems: 1 }, known_clues: { ...commonSchema, properties: { query: { type: "string" }, category: { type: "string" }, colors: { type: "array", items: { type: "string" } }, features: { type: "array", items: { type: "string" } }, location: { type: "string" }, date: { type: "string" } } }, negative_clues: { type: "array", items: { type: "string" } } }, required: ["item_ids"] }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input: CompareItemsInput, context) => { context?.signal?.throwIfAborted(); const session = input.session_id ? requireSession(store, input.session_id) : null; if (input.session_id && !session) return staleSessionError(input.session_id); const clues = mergeSearchClues(session?.clues ?? [], cluesFromKnown(input.known_clues, input.negative_clues)); const candidates = items.filter((item) => input.item_ids.includes(item.id)); const [best, ...alternatives] = compareItemsWithClues(candidates, clues); if (!best) return { error: { code: "no_candidates", message: "No valid candidate items." } }; if (session) { const compared = investigationReducer(session, { type: "best_match", sessionId: session.id, itemId: best.item.id })!; publishSession(store, callbacks, { ...compared, searches: [...compared.searches, createSearchStep(`Compared evidence · ${best.item.id}`, input.item_ids, now())] }); } callbacks.onHighlight(best.item.id); callbacks.onActivity({ tool: "compare_items", message: `${Math.round(best.score * 100)}% match · ${best.item.id}`, state: "done" }); return { best_match: matchShape(best), alternatives: alternatives.map(matchShape) }; },
    },
    {
      name: "get_match_evidence", title: "Get match evidence", description: "Explain one candidate using the exact positive and contradiction score breakdown used by ranking. Does not open a claim.",
      inputSchema: { ...commonSchema, properties: { item_id: { type: "string", pattern: "^LF-[0-9]{3}$" }, session_id: { type: "string" }, known_clues: { ...commonSchema, properties: { query: { type: "string" }, category: { type: "string" }, colors: { type: "array", items: { type: "string" } }, features: { type: "array", items: { type: "string" } }, location: { type: "string" }, date: { type: "string" } } }, negative_clues: { type: "array", items: { type: "string" } } }, required: ["item_id"] }, annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (input: { item_id: string; session_id?: string; known_clues?: KnownCluesInput; negative_clues?: string[] }, context) => { context?.signal?.throwIfAborted(); const item = items.find((candidate) => candidate.id === input.item_id); if (!item) return { error: { code: "item_not_found", message: "Item not found." } }; const session = input.session_id ? requireSession(store, input.session_id) : null; if (input.session_id && !session) return staleSessionError(input.session_id); const clues = mergeSearchClues(session?.clues ?? [], cluesFromKnown(input.known_clues, input.negative_clues)); const result = compareItemWithClues(item, clues); if (session) publishSession(store, callbacks, { ...session, bestMatch: item.id, status: "possible_match", searches: [...session.searches, createSearchStep(`Evidence for ${item.id}`, [item.id], now())] }); callbacks.onEvidence?.(result); callbacks.onHighlight(item.id); callbacks.onActivity({ tool: "get_match_evidence", message: `${result.match_strength} · ${item.id}`, state: "done" }); return { item_id: item.id, summary: { strength: result.match_strength, score: result.score }, evidence: { matched: result.matched, unknown: result.unknown, contradictions: result.contradictions }, score_breakdown: result.score_breakdown.filter((entry) => entry.type !== "unknown") }; },
    },
    {
      name: "request_claim", title: "Request claim confirmation", description: "Open the human confirmation step for one possible match. The agent cannot complete a claim without the user.",
      inputSchema: { ...commonSchema, properties: { item_id: { type: "string", pattern: "^LF-[0-9]{3}$" } }, required: ["item_id"] }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: ({ item_id }: { item_id: string }, context) => { context?.signal?.throwIfAborted(); const item = items.find((candidate) => candidate.id === item_id); if (!item) return { error: { code: "item_not_found", message: "Item not found." } }; const session = store.get(); if (session) { const confirmation = investigationReducer(session, { type: "request_confirmation", sessionId: session.id, itemId: item_id })!; publishSession(store, callbacks, { ...confirmation, searches: [...confirmation.searches, createSearchStep("Waiting for you · Human confirmation", [item_id], now())] }); } callbacks.onClaim(item); callbacks.onActivity({ tool: "request_claim", message: "Waiting for human", state: "active" }); return { status: "confirmation_required", item_id, message: "Human confirmation is required to claim this item." }; },
    },
  ];
}
