export type ItemStatus = "unclaimed" | "claim-pending";

export interface LocalizedItemText {
  name: string;
  category: string;
  color: string[];
  description: string;
  distinctive_features: string[];
  found_location: string;
  found_area: string;
  tags: string[];
}

export interface LostItem {
  id: string;
  name: string;
  category: string;
  color: string[];
  description: string;
  distinctive_features: string[];
  found_location: string;
  found_area: string;
  found_date: string;
  status: ItemStatus;
  image: string;
  tags: string[];
  localized?: {
    "zh-TW": LocalizedItemText;
  };
}

export interface SearchInput {
  query?: string;
  category?: string;
  color?: string;
  colors?: string[];
  location?: string;
  date?: string;
  features?: string[];
  limit?: number;
}

export interface UserDescription {
  query?: string;
  category?: string;
  color?: string;
  colors?: string[];
  location?: string;
  date?: string;
  features?: string[];
}

export interface SearchResult {
  item: LostItem;
  score: number;
  confidence: number;
  matched_terms: string[];
  missing_terms: string[];
  matched_fields: string[];
}

export interface MatchResult {
  item: LostItem;
  score: number;
  match_strength: import("./investigation").MatchStrength;
  matched: string[];
  unknown: string[];
  contradictions: string[];
  score_breakdown: import("./investigation").EvidenceBreakdown[];
  matched_features: string[];
  missing_features: string[];
}
