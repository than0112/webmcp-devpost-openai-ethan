import type { LostItem, MatchResult, UserDescription } from "../types/item";
import { resolveDate } from "./search";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function containsClue(item: LostItem, clue: string) {
  const words = normalize(clue).split(" ").filter(Boolean);
  const text = normalize(`${item.name} ${item.description} ${item.distinctive_features.join(" ")} ${item.tags.join(" ")}`);
  return words.every((word) => text.includes(word));
}

export function compareItem(item: LostItem, description: UserDescription): MatchResult {
  let earned = 0;
  let possible = 0;
  const matched: string[] = [];
  const missing: string[] = [];

  if (description.category) {
    possible += 20;
    if (normalize(item.category).includes(normalize(description.category))) {
      earned += 20;
      matched.push(description.category);
    } else missing.push(description.category);
  }

  if (description.color) {
    possible += 20;
    if (item.color.some((color) => normalize(color).includes(normalize(description.color!)))) {
      earned += 20;
      matched.push(description.color);
    } else missing.push(description.color);
  }

  if (description.location) {
    possible += 15;
    if (normalize(`${item.found_location} ${item.found_area} ${item.tags.join(" ")}`).includes(normalize(description.location))) {
      earned += 15;
      matched.push(description.location);
    } else missing.push(description.location);
  }

  if (description.date) {
    possible += 15;
    if (item.found_date === resolveDate(description.date)) {
      // Relative dates carry slightly less certainty than an exact calendar date.
      earned += normalize(description.date) === "yesterday" ? 12 : 15;
      matched.push(description.date);
    } else missing.push(description.date);
  }

  for (const feature of description.features ?? []) {
    possible += 15;
    if (containsClue(item, feature)) {
      earned += 15;
      matched.push(feature);
    } else missing.push(feature);
  }

  return {
    item,
    score: possible === 0 ? 0 : Math.round((earned / possible) * 100) / 100,
    matched_features: matched,
    missing_features: missing,
  };
}

export function compareItems(items: LostItem[], description: UserDescription): MatchResult[] {
  return items.map((item) => compareItem(item, description)).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
}
