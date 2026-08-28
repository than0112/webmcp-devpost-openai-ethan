import type { SearchClue } from "../types/investigation";
import { normalizeClue } from "./normalize";

export interface ClueGroups {
  positive: SearchClue[];
  negative: SearchClue[];
  unknown: SearchClue[];
}

export function groupClues(clues: SearchClue[], unknownValues: string[] = []): ClueGroups {
  const unknown = new Set(unknownValues.map(normalizeClue));
  return clues.reduce<ClueGroups>((groups, clue) => {
    if (clue.kind === "negative") groups.negative.push(clue);
    else if (unknown.has(normalizeClue(clue.value))) groups.unknown.push(clue);
    else groups.positive.push(clue);
    return groups;
  }, { positive: [], negative: [], unknown: [] });
}

export function clueActionReason(clues: SearchClue[], clue: SearchClue, action: "add" | "reject") {
  const normalized = normalizeClue(clue.value);
  if (!normalized) return "invalid" as const;
  const kind = action === "reject" ? "negative" : clue.kind;
  if (clues.some((current) => current.kind === kind && normalizeClue(current.value) === normalized)) return "duplicate" as const;
  return null;
}
