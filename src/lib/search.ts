import type { LostItem, SearchInput, SearchResult } from "../types/item";

export const DATASET_TODAY = "2026-08-27";

export const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

const STOP_WORDS = new Set([
  "a", "an", "and", "at", "can", "find", "for", "from", "i", "in", "is", "it", "lost", "me", "my", "of", "on", "please", "the", "this", "to", "was", "with",
]);

const CATEGORY_ALIASES: Record<string, string> = {
  airpods: "audio", backpack: "bag", earbuds: "audio", gloves: "accessory", handbag: "bag",
  hat: "accessory", headphones: "audio", keychain: "keys", messenger: "bag", pen: "other",
  scarf: "accessory", thermos: "bottle", tote: "bag",
};

export const tokenize = (value: string) => normalize(value).split(" ").filter((token) => token && !STOP_WORDS.has(token));

const tokenMatches = (text: string, token: string) => {
  const words = tokenize(text);
  return words.some((word) => word === token || (word.length >= 4 && token.length >= 4 && (word.includes(token) || token.includes(word))));
};

export function normalizeCategory(value?: string) {
  const category = normalize(value ?? "");
  return CATEGORY_ALIASES[category] ?? category;
}

export function resolveDate(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = normalize(value);
  if (normalized === "yesterday") return "2026-08-26";
  if (normalized === "today") return DATASET_TODAY;
  return value;
}

function matchesStructuredFilters(item: LostItem, input: SearchInput) {
  const category = normalizeCategory(input.category);
  const color = normalize(input.color ?? "");
  const location = normalize(input.location ?? "");
  const date = resolveDate(input.date);
  return (!category || normalize(item.category) === category)
    && (!color || item.color.some((value) => tokenMatches(value, color)))
    && (!location || tokenMatches(`${item.found_location} ${item.found_area} ${item.tags.join(" ")}`, location))
    && (!date || item.found_date === date);
}

function scoreItem(item: LostItem, input: SearchInput): SearchResult {
  const naturalLanguage = [input.query, input.category, input.color, input.location, ...(input.features ?? [])].filter(Boolean).join(" ");
  const queryTokens = [...new Set(tokenize(naturalLanguage))];
  const nameTokens = tokenize(item.name);
  const exactNameMatch = nameTokens.length > 0 && nameTokens.every((token) => queryTokens.includes(token));
  const fields = [
    { name: "category", value: item.category, weight: 30 },
    { name: "distinctive feature", value: item.distinctive_features.join(" "), weight: 25 },
    { name: "tag", value: item.tags.join(" "), weight: 20 },
    { name: "color", value: item.color.join(" "), weight: 15 },
    { name: "location", value: item.found_location, weight: 15 },
    { name: "area", value: item.found_area, weight: 10 },
    { name: "description", value: `${item.name} ${item.description}`, weight: 5 },
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
