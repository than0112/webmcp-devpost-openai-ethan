import type { LostItem } from "../types/item";
import type { FacetField, InformationGain, SearchClue, SearchFacet } from "../types/investigation";
import { normalizeClue, normalizeText } from "./normalize";

const FIELD_PRIORITY: FacetField[] = ["distinctive_features", "color", "location", "area", "category", "tags"];
const MINIMUM_COVERAGE = 0.5;

const GENERIC_TAGS = new Set(["accessory", "audio", "bag", "bottle", "glasses", "keys", "other", "umbrella", "wallet"]);

const QUESTION_TEMPLATES: Record<FacetField, string> = {
  category: "What type of item was it?",
  color: "What color was it?",
  distinctive_features: "Did it have a distinctive feature or charm?",
  location: "Where might you have lost it?",
  area: "Which area were you in?",
  tags: "Which of these details best describes it?",
};

function canonicalFeatures(item: LostItem) {
  const exclusions = new Set([
    normalizeClue(item.category),
    ...item.color.map(normalizeClue),
    normalizeClue(item.found_location),
    normalizeClue(item.found_area),
  ]);
  const controlled = item.tags
    .map((tag) => normalizeText(tag).replaceAll("-", " "))
    .map(normalizeClue)
    .filter((value) => value && !GENERIC_TAGS.has(value) && !exclusions.has(value));
  return [...new Set(controlled)];
}

function valuesFor(item: LostItem, field: FacetField): string[] {
  if (field === "category") return [normalizeClue(item.category)];
  if (field === "color") return item.color.map(normalizeClue);
  if (field === "distinctive_features") return canonicalFeatures(item);
  if (field === "location") return [normalizeClue(item.found_location)];
  if (field === "area") return [normalizeClue(item.found_area)];
  return item.tags.map(normalizeClue).filter((value) => value && !GENERIC_TAGS.has(value));
}

function informationGain(score: number): InformationGain {
  if (score >= 0.7) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

export function getSearchFacets(candidates: LostItem[], knownClues: SearchClue[] = []): SearchFacet[] {
  if (candidates.length <= 1) return [];
  const excludedFields = new Set<string>(knownClues.map((clue) => clue.kind === "feature" ? "distinctive_features" : clue.kind));
  const excludedValues = new Set(knownClues.map((clue) => normalizeClue(clue.value)));

  return FIELD_PRIORITY
    .filter((field) => !excludedFields.has(field))
    .map((field) => {
      const candidateValues = candidates.map((item) => valuesFor(item, field).filter((value) => !excludedValues.has(value)));
      const covered = candidateValues.filter((values) => values.length > 0).length;
      const coverage = covered / candidates.length;
      const uniqueValues = [...new Set(candidateValues.flat())].sort();
      const discrimination = Math.min(1, Math.max(0, (uniqueValues.length - 1) / (candidates.length - 1)));
      const score = Math.round(discrimination * coverage * 100) / 100;
      return {
        field,
        question_hint: QUESTION_TEMPLATES[field],
        information_gain: informationGain(score),
        score,
        example_values: uniqueValues.slice(0, 4),
        coverage,
      };
    })
    .filter((facet) => facet.coverage >= MINIMUM_COVERAGE && facet.score > 0)
    .sort((left, right) => right.score - left.score || FIELD_PRIORITY.indexOf(left.field) - FIELD_PRIORITY.indexOf(right.field))
    .slice(0, 3)
    .map(({ coverage: _coverage, ...facet }) => facet);
}
