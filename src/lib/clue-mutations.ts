import type { Casefile, CaseStepType, ScoreSnapshot } from "../types/casefile";
import type { LostItem } from "../types/item";
import type { SearchClue } from "../types/investigation";
import { MAX_CLUE_LENGTH } from "./casefile";
import { compareItemsWithClues } from "./matching";
import { normalizeClue } from "./normalize";

export type ClueMutation =
  | { action: "add"; clue: SearchClue }
  | { action: "reject"; clue: SearchClue }
  | { action: "replace"; previous: SearchClue; next: SearchClue };

export interface ClueMutationState {
  clues: SearchClue[];
  undoStack: SearchClue[][];
}

export type ClueMutationResult =
  | { ok: true; changed: true; state: ClueMutationState; stepType: Extract<CaseStepType, "clue_added" | "clue_rejected" | "clue_replaced"> }
  | { ok: true; changed: false; state: ClueMutationState; reason: "duplicate" }
  | { ok: false; state: ClueMutationState; error: "invalid_clue" | "missing_previous" };

const SINGLE_VALUE_KINDS = new Set<SearchClue["kind"]>(["category", "color", "location", "date"]);

function validClue(clue: SearchClue) {
  return clue.value.trim().length > 0 && clue.value.length <= MAX_CLUE_LENGTH && normalizeClue(clue.value).length > 0;
}

function clueKey(clue: SearchClue) {
  return `${clue.kind}:${normalizeClue(clue.value)}`;
}

function sameClue(left: SearchClue, right: SearchClue) {
  return clueKey(left) === clueKey(right);
}

function conflictWith(next: SearchClue, current: SearchClue) {
  const nextValue = normalizeClue(next.value);
  const currentValue = normalizeClue(current.value);
  if (nextValue === currentValue && (next.kind === "negative" || current.kind === "negative")) return true;
  if (next.kind === current.kind && SINGLE_VALUE_KINDS.has(next.kind)) return true;
  return false;
}

function humanClue(clue: SearchClue): SearchClue {
  return { ...clue, value: clue.value.trim(), source: "human" };
}

function commit(state: ClueMutationState, clues: SearchClue[], stepType: ClueMutationResult extends infer _ ? Extract<CaseStepType, "clue_added" | "clue_rejected" | "clue_replaced"> : never): ClueMutationResult {
  return { ok: true, changed: true, state: { clues, undoStack: [...state.undoStack, state.clues.map((clue) => ({ ...clue }))] }, stepType };
}

export function applyClueMutation(state: ClueMutationState, mutation: ClueMutation): ClueMutationResult {
  if (mutation.action === "replace") {
    if (!validClue(mutation.previous) || !validClue(mutation.next)) return { ok: false, state, error: "invalid_clue" };
    const previousIndex = state.clues.findIndex((clue) => sameClue(clue, mutation.previous));
    if (previousIndex < 0) return { ok: false, state, error: "missing_previous" };
    const next = humanClue(mutation.next);
    const withoutPrevious = state.clues.filter((_, index) => index !== previousIndex);
    const clues = [...withoutPrevious.filter((clue) => !sameClue(clue, next) && !conflictWith(next, clue)), next];
    return commit(state, clues, "clue_replaced");
  }

  if (!validClue(mutation.clue)) return { ok: false, state, error: "invalid_clue" };
  const next = mutation.action === "reject"
    ? humanClue({ ...mutation.clue, kind: "negative" })
    : humanClue(mutation.clue);
  if (state.clues.some((clue) => sameClue(clue, next))) return { ok: true, changed: false, state, reason: "duplicate" };
  const clues = [...state.clues.filter((clue) => !conflictWith(next, clue)), next];
  return commit(state, clues, mutation.action === "reject" ? "clue_rejected" : "clue_added");
}

export function undoClueMutation(state: ClueMutationState) {
  const previous = state.undoStack.at(-1);
  if (!previous) return { changed: false, state } as const;
  return { changed: true, state: { clues: previous, undoStack: state.undoStack.slice(0, -1) } } as const;
}

function snapshotFor(stepId: string, ranked: ReturnType<typeof compareItemsWithClues>): ScoreSnapshot {
  return {
    stepId,
    scores: Object.fromEntries(ranked.map((result) => [result.item.id, result.score])),
    breakdowns: Object.fromEntries(ranked.map((result) => [result.item.id, result.score_breakdown])),
  };
}

export function applyMutationToCasefile(casefile: Casefile, mutation: ClueMutation, items: LostItem[], createdAt = Date.now()) {
  const mutationResult = applyClueMutation({ clues: casefile.clues, undoStack: [] }, mutation);
  if (!mutationResult.ok || !mutationResult.changed) return { mutation: mutationResult, casefile };
  const allRanked = compareItemsWithClues(items, mutationResult.state.clues);
  const ranked = allRanked.filter((result) => result.score > 0);
  const candidateIds = ranked.slice(0, 10).map((result) => result.item.id);
  const stepId = `step-${createdAt}-${casefile.steps.length}`;
  const step = { id: stepId, type: mutationResult.stepType, labelKey: `timeline.${mutationResult.stepType}`, candidateIds, createdAt } as const;
  return {
    mutation: mutationResult,
    casefile: {
      ...casefile,
      clues: mutationResult.state.clues,
      candidateIds,
      bestMatch: candidateIds[0],
      steps: [...casefile.steps, step],
      scoreSnapshots: [...casefile.scoreSnapshots, snapshotFor(stepId, allRanked)],
      status: candidateIds.length ? "possible_match" : "needs_clue",
      claimCandidateId: undefined,
      updatedAt: createdAt,
    } satisfies Casefile,
  };
}
