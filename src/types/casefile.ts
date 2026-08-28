import type { EvidenceBreakdown, SearchClue } from "./investigation";

export type SupportedLocale = "en" | "zh-TW";

export type CaseStatus =
  | "searching"
  | "needs_clue"
  | "possible_match"
  | "confirmation_required"
  | "completed";

export type CaseStepType =
  | "search"
  | "facet"
  | "clue_added"
  | "clue_rejected"
  | "clue_replaced"
  | "compare"
  | "evidence"
  | "claim_requested"
  | "claim_confirmed";

export interface CaseStep {
  id: string;
  type: CaseStepType;
  labelKey: string;
  candidateIds: string[];
  createdAt: number;
}

export interface ScoreSnapshot {
  stepId: string;
  scores: Record<string, number>;
  breakdowns: Record<string, EvidenceBreakdown[]>;
}

export type RankMovement = "up" | "down" | "same" | "entered" | "removed";

export interface ChangedEvidence extends EvidenceBreakdown {
  change: "added" | "removed" | "changed";
  previousPoints?: number;
}

export interface RankDelta {
  item_id: string;
  previous_rank?: number;
  current_rank?: number;
  previous_score?: number;
  current_score?: number;
  score_delta: number;
  movement: RankMovement;
  changed_evidence: ChangedEvidence[];
}

export interface Casefile {
  version: 1;
  id: string;
  locale: SupportedLocale;
  originalDescription: string;
  clues: SearchClue[];
  candidateIds: string[];
  bestMatch?: string;
  steps: CaseStep[];
  scoreSnapshots: ScoreSnapshot[];
  status: CaseStatus;
  claimCandidateId?: string;
  createdAt: number;
  updatedAt: number;
}

export type CasefileValidationResult =
  | { ok: true; casefile: Casefile; warnings: string[] }
  | { ok: false; error: "invalid_json" | "invalid_payload" | "unsupported_version" };
