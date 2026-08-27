import type { LostItem, MatchResult, UserDescription } from "../types/item";
import { rankItems } from "./search";

export function compareItem(item: LostItem, description: UserDescription): MatchResult {
  const [result] = rankItems([item], description, { strictFilters: false });
  return {
    item,
    score: result?.confidence ?? 0,
    matched_features: result?.matched_terms ?? [],
    missing_features: result?.missing_terms ?? [],
  };
}

export function compareItems(items: LostItem[], description: UserDescription): MatchResult[] {
  return rankItems(items, description, { strictFilters: false }).map((result) => ({
    item: result.item,
    score: result.confidence,
    matched_features: result.matched_terms,
    missing_features: result.missing_terms,
  }));
}
