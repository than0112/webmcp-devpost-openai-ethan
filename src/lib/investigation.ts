import type { InvestigationSession, InvestigationStatus, SearchClue, SearchStep } from "../types/investigation";
import { normalizeClue } from "./normalize";

const SINGLE_VALUE_KINDS = new Set<SearchClue["kind"]>(["category", "color", "location", "date"]);

export function mergeSearchClues(existing: SearchClue[], incoming: SearchClue[]) {
  const incomingKinds = new Set(incoming.filter((clue) => SINGLE_VALUE_KINDS.has(clue.kind)).map((clue) => clue.kind));
  const merged = existing.filter((clue) => !incomingKinds.has(clue.kind));
  const seen = new Set(merged.map((clue) => `${clue.kind}:${normalizeClue(clue.value)}`));
  for (const clue of incoming) {
    const normalized = normalizeClue(clue.value);
    const key = `${clue.kind}:${normalized}`;
    if (!normalized || seen.has(key)) continue;
    merged.push({ ...clue, value: clue.value.trim() });
    seen.add(key);
  }
  return merged;
}

export function statusForCandidates(candidateCount: number): InvestigationStatus {
  if (candidateCount === 1) return "possible_match";
  return "needs_clue";
}

export function createSearchStep(label: string, candidateIds: string[], createdAt = Date.now()): SearchStep {
  return {
    id: `step-${createdAt}`,
    label,
    candidateCount: candidateIds.length,
    candidateIds: [...candidateIds],
    createdAt,
  };
}

export function createInvestigationSession(input: {
  id: string;
  originalQuery: string;
  clues: SearchClue[];
  candidateIds: string[];
  label?: string;
  createdAt?: number;
}): InvestigationSession {
  const step = createSearchStep(input.label ?? (input.originalQuery || "Initial search"), input.candidateIds, input.createdAt);
  return {
    id: input.id,
    originalQuery: input.originalQuery,
    clues: mergeSearchClues([], input.clues),
    candidateIds: [...input.candidateIds],
    searches: [step],
    status: statusForCandidates(input.candidateIds.length),
  };
}

export type InvestigationAction =
  | { type: "start"; session: InvestigationSession }
  | { type: "search"; sessionId: string; clues: SearchClue[]; candidateIds: string[]; label: string; createdAt?: number }
  | { type: "best_match"; sessionId: string; itemId: string }
  | { type: "request_confirmation"; sessionId: string; itemId: string }
  | { type: "complete"; sessionId: string }
  | { type: "reset" };

export function investigationReducer(state: InvestigationSession | null, action: InvestigationAction): InvestigationSession | null {
  if (action.type === "reset") return null;
  if (action.type === "start") return action.session;
  if (!state || action.sessionId !== state.id) return state;
  if (action.type === "search") {
    return {
      ...state,
      clues: mergeSearchClues(state.clues, action.clues),
      candidateIds: [...action.candidateIds],
      searches: [...state.searches, createSearchStep(action.label, action.candidateIds, action.createdAt)],
      bestMatch: undefined,
      status: statusForCandidates(action.candidateIds.length),
    };
  }
  if (action.type === "best_match") return { ...state, bestMatch: action.itemId, status: "possible_match" };
  if (action.type === "request_confirmation") return { ...state, bestMatch: action.itemId, status: "confirmation_required" };
  return { ...state, status: "completed" };
}
