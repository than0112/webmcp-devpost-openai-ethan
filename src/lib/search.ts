import type { LostItem, SearchInput, SearchResult } from "../types/item";
import { hasAllTokens, normalizeCategory, normalizeText, tokenize } from "./normalize";

export { normalizeCategory, normalizeText as normalize, tokenize } from "./normalize";

export const DATASET_TODAY = "2026-08-27";

const tokenMatches = (text: string, token: string) => hasAllTokens(text, token);

function localizedText(item: LostItem) {
  const localized = item.localized?.["zh-TW"];
  return localized ? [localized.name, localized.category, ...localized.color, localized.description, ...localized.distinctive_features, localized.found_location, localized.found_area, ...localized.tags].join(" ") : "";
}

export function resolveDate(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = tokenize(value).join(" ");
  if (normalized === "yesterday") return "2026-08-26";
  if (normalized === "today") return DATASET_TODAY;
  return value;
}

function matchesStructuredFilters(item: LostItem, input: SearchInput) {
  const category = normalizeCategory(input.category);
  const color = normalizeText(input.color ?? "");
  const location = normalizeText(input.location ?? "");
  const date = resolveDate(input.date);
  return (!category || normalizeText(item.category) === category)
    && (!color || [...item.color, ...(item.localized?.["zh-TW"].color ?? [])].some((value) => tokenMatches(value, color)))
    && (!location || tokenMatches(`${item.found_location} ${item.found_area} ${item.tags.join(" ")} ${localizedText(item)}`, location))
    && (!date || item.found_date === date);
}

function scoreItem(item: LostItem, input: SearchInput): SearchResult {
  const naturalLanguage = [input.query, input.category, input.color, input.location, ...(input.features ?? [])].filter(Boolean).join(" ");
  const queryTokens = [...new Set(tokenize(naturalLanguage))];
  const normalizedQuery = ` ${normalizeText(naturalLanguage)} `;
  const exactNameMatch = [item.name, item.localized?.["zh-TW"].name]
    .filter((name): name is string => Boolean(name))
    .some((name) => normalizedQuery.includes(` ${normalizeText(name)} `));
  const fields = [
    { name: "category", value: `${item.category} ${item.localized?.["zh-TW"].category ?? ""}`, weight: 30 },
    { name: "distinctive feature", value: `${item.distinctive_features.join(" ")} ${item.localized?.["zh-TW"].distinctive_features.join(" ") ?? ""}`, weight: 25 },
    { name: "tag", value: `${item.tags.join(" ")} ${item.localized?.["zh-TW"].tags.join(" ") ?? ""}`, weight: 20 },
    { name: "color", value: `${item.color.join(" ")} ${item.localized?.["zh-TW"].color.join(" ") ?? ""}`, weight: 15 },
    { name: "location", value: `${item.found_location} ${item.localized?.["zh-TW"].found_location ?? ""}`, weight: 15 },
    { name: "area", value: `${item.found_area} ${item.localized?.["zh-TW"].found_area ?? ""}`, weight: 10 },
    { name: "description", value: `${item.name} ${item.description} ${localizedText(item)}`, weight: 5 },
  ];
  let score = exactNameMatch ? 40 : 0;
  let possible = exactNameMatch ? 40 : 0;
  const matchedTerms: string[] = [];
  const missingTerms: string[] = [];
  const matchedFields = new Set<string>();

  for (const token of queryTokens) {
    possible += 30;
    const bestField = fields
      .filter((field) => tokenMatches(field.value, token))
      .sort((left, right) => right.weight - left.weight)[0];
    if (bestField) {
      score += bestField.weight;
      matchedTerms.push(token);
      matchedFields.add(bestField.name);
    } else {
      missingTerms.push(token);
    }
  }

  if (input.date) {
    possible += 15;
    if (item.found_date === resolveDate(input.date)) {
      score += 15;
      matchedFields.add("date");
    } else {
      missingTerms.push(input.date);
    }
  }

  return {
    item,
    score,
    confidence: possible === 0 ? 0 : Math.round(Math.min(0.99, score / possible) * 100) / 100,
    matched_terms: matchedTerms,
    missing_terms: [...new Set(missingTerms)],
    matched_fields: [...matchedFields],
  };
}

export function rankItems(items: LostItem[], input: SearchInput, options: { strictFilters?: boolean } = {}): SearchResult[] {
  const hasTerms = tokenize([input.query, input.category, input.color, input.location, ...(input.features ?? [])].filter(Boolean).join(" ")).length > 0;
  const ranked = items
    .filter((item) => options.strictFilters === false || matchesStructuredFilters(item, input))
    .map((item) => scoreItem(item, input))
    .filter((result) => !hasTerms || result.score > 0)
    .sort((left, right) => right.score - left.score || left.item.id.localeCompare(right.item.id));
  return typeof input.limit === "number" ? ranked.slice(0, Math.max(1, Math.min(30, input.limit))) : ranked;
}

export function searchItems(items: LostItem[], input: SearchInput): LostItem[] {
  return rankItems(items, input).map((result) => result.item);
}

export function selectRelevantResults(results: SearchResult[]) {
  const relevanceFloor = results[0] ? Math.max(0.4, results[0].confidence * 0.55) : 0;
  return results.filter((result) => result.confidence >= relevanceFloor);
}
