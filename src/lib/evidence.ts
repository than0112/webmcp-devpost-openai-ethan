import type { LostItem } from "../types/item";
import type { EvidenceBreakdown, EvidenceEvaluation, MatchStrength, SearchClue } from "../types/investigation";
import { hasAllTokens, normalizeCategory, normalizeClue, normalizeText } from "./normalize";

const POSITIVE_WEIGHTS: Record<SearchClue["kind"], number> = {
  query: 5,
  category: 30,
  color: 15,
  feature: 25,
  location: 15,
  date: 15,
  negative: 0,
};

const CONTRADICTION_PENALTIES: Record<SearchClue["kind"], number> = {
  query: 0,
  category: 40,
  color: 20,
  feature: 30,
  location: 15,
  date: 15,
  negative: 30,
};

function searchableMetadata(item: LostItem) {
  return [item.name, item.category, ...item.color, item.description, ...item.distinctive_features, item.found_location, item.found_area, ...item.tags].join(" ");
}

function positiveMatch(item: LostItem, clue: SearchClue) {
  if (clue.kind === "category") return normalizeText(item.category) === normalizeCategory(clue.value);
  if (clue.kind === "color") return item.color.some((color) => hasAllTokens(color, clue.value));
  if (clue.kind === "location") return hasAllTokens(`${item.found_location} ${item.found_area} ${item.tags.join(" ")}`, clue.value);
  if (clue.kind === "date") return item.found_date === clue.value;
  return hasAllTokens(searchableMetadata(item), clue.value);
}

function isStructuredConflict(clue: SearchClue) {
  return clue.kind === "category" || clue.kind === "color" || clue.kind === "location" || clue.kind === "date";
}

export function evaluateItemEvidence(item: LostItem, clues: SearchClue[]): EvidenceEvaluation {
  const matched: string[] = [];
  const unknown: string[] = [];
  const contradictions: string[] = [];
  const score_breakdown: EvidenceBreakdown[] = [];
  const seen = new Set<string>();
  let earned = 0;
  let penalty = 0;
  let possible = 0;

  for (const clue of clues) {
    const normalized = normalizeClue(clue.value);
    const key = `${clue.kind}:${normalized}`;
    if (!normalized || seen.has(key)) continue;
    seen.add(key);

    if (clue.kind === "negative") {
      if (hasAllTokens(searchableMetadata(item), clue.value)) {
        const points = -CONTRADICTION_PENALTIES.negative;
        penalty += Math.abs(points);
        contradictions.push(clue.value);
        score_breakdown.push({ clue: clue.value, field: "negative", points, type: "contradiction" });
      }
      continue;
    }

    const weight = POSITIVE_WEIGHTS[clue.kind];
    possible += weight;
    if (positiveMatch(item, clue)) {
      earned += weight;
      matched.push(clue.value);
      score_breakdown.push({ clue: clue.value, field: clue.kind, points: weight, type: "positive" });
    } else if (isStructuredConflict(clue)) {
      const points = -CONTRADICTION_PENALTIES[clue.kind];
      penalty += Math.abs(points);
      contradictions.push(clue.value);
      score_breakdown.push({ clue: clue.value, field: clue.kind, points, type: "contradiction" });
    } else {
      unknown.push(clue.value);
    }
  }

  return { matched, unknown, contradictions, score_breakdown, earned, penalty, possible };
}

export function getMatchStrength(score: number): MatchStrength {
  if (score >= 0.85) return "strong";
  if (score >= 0.65) return "possible";
  if (score >= 0.4) return "weak";
  return "unlikely";
}

