export type ClueKind = "query" | "category" | "color" | "feature" | "location" | "date" | "negative";

export interface SearchClue {
  kind: ClueKind;
  value: string;
  source: "human" | "agent" | "query";
}

export type FacetField = "category" | "color" | "distinctive_features" | "location" | "area" | "tags";
export type InformationGain = "high" | "medium" | "low";

export interface SearchFacet {
  field: FacetField;
  question_hint: string;
  information_gain: InformationGain;
  score: number;
  example_values: string[];
}

export type EvidenceType = "positive" | "unknown" | "contradiction";

export interface EvidenceBreakdown {
  clue: string;
  field: string;
  points: number;
  type: EvidenceType;
}

export interface EvidenceEvaluation {
  matched: string[];
  unknown: string[];
  contradictions: string[];
  score_breakdown: EvidenceBreakdown[];
  earned: number;
  penalty: number;
  possible: number;
}

export type MatchStrength = "strong" | "possible" | "weak" | "unlikely";

export type InvestigationStatus = "searching" | "needs_clue" | "possible_match" | "confirmation_required" | "completed";

export interface SearchStep {
  id: string;
  label: string;
  candidateCount: number;
  candidateIds: string[];
  createdAt: number;
}

export interface InvestigationSession {
  id: string;
  originalQuery: string;
  clues: SearchClue[];
  candidateIds: string[];
  searches: SearchStep[];
  bestMatch?: string;
  status: InvestigationStatus;
}

