import type { LostItem, MatchResult, UserDescription } from "../types/item";
import type { SearchClue } from "../types/investigation";
import { evaluateItemEvidence, getMatchStrength } from "./evidence";
import { normalizeClue, tokenize } from "./normalize";
import { resolveDate } from "./search";

export function descriptionToClues(description: UserDescription, negativeClues: string[] = []): SearchClue[] {
  const clues: SearchClue[] = [];
  const add = (kind: SearchClue["kind"], value: string | undefined, source: SearchClue["source"] = "agent") => {
    if (value?.trim()) clues.push({ kind, value: value.trim(), source });
  };
  for (const token of [...new Set(tokenize(description.query ?? ""))]) add("query", token, "query");
  add("category", description.category);
  add("color", description.color);
  add("location", description.location);
  add("date", resolveDate(description.date));
  for (const feature of description.features ?? []) add("feature", feature);
  for (const negative of negativeClues) add("negative", negative);
  return clues;
}

export function scoreFromEvidence(earned: number, penalty: number, possible: number) {
  if (possible <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, (earned - penalty) / possible)) * 100) / 100;
}

export function compareItem(item: LostItem, description: UserDescription, negativeClues: string[] = []): MatchResult {
  const evidence = evaluateItemEvidence(item, descriptionToClues(description, negativeClues));
  const score = scoreFromEvidence(evidence.earned, evidence.penalty, evidence.possible);
  return {
    item,
    score,
    match_strength: getMatchStrength(score),
    matched: evidence.matched,
    unknown: evidence.unknown,
    contradictions: evidence.contradictions,
    score_breakdown: evidence.score_breakdown,
    matched_features: evidence.matched.map(normalizeClue),
    missing_features: [...evidence.unknown, ...evidence.contradictions].map(normalizeClue),
  };
}

export function compareItems(items: LostItem[], description: UserDescription, negativeClues: string[] = []): MatchResult[] {
  return items
    .map((item) => compareItem(item, description, negativeClues))
    .sort((left, right) => right.score - left.score || right.matched.length - left.matched.length || left.item.id.localeCompare(right.item.id));
}
