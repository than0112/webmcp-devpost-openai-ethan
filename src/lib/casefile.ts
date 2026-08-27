import type { Casefile, CasefileValidationResult, CaseStatus, CaseStep, CaseStepType, ScoreSnapshot, SupportedLocale } from "../types/casefile";
import type { EvidenceBreakdown, EvidenceType, SearchClue } from "../types/investigation";

export const CASEFILE_VERSION = 1 as const;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_CLUE_LENGTH = 120;
export const DEMO_CASE_ID = "demo-case-v3";
export const DEMO_TIMESTAMP = Date.UTC(2026, 7, 27, 12, 0, 0);

const LOCALES = new Set<SupportedLocale>(["en", "zh-TW"]);
const STATUSES = new Set<CaseStatus>(["searching", "needs_clue", "possible_match", "confirmation_required", "completed"]);
const STEP_TYPES = new Set<CaseStepType>(["search", "facet", "clue_added", "clue_rejected", "clue_replaced", "compare", "evidence", "claim_requested", "claim_confirmed"]);
const CLUE_KINDS = new Set<SearchClue["kind"]>(["query", "category", "color", "feature", "location", "date", "negative"]);
const CLUE_SOURCES = new Set<SearchClue["source"]>(["human", "agent", "query"]);
const EVIDENCE_TYPES = new Set<EvidenceType>(["positive", "unknown", "contradiction"]);

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, maxLength = 200): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function uniqueValidIds(value: unknown, catalogIds: ReadonlySet<string>, warnings: string[]) {
  if (!Array.isArray(value) || !value.every((id) => typeof id === "string")) return null;
  const ids = [...new Set(value.filter((id) => catalogIds.has(id)))];
  if (ids.length !== value.length) warnings.push("Removed missing or duplicate catalog item references.");
  return ids;
}

function validateClue(value: unknown): SearchClue | null {
  if (!isRecord(value) || !CLUE_KINDS.has(value.kind as SearchClue["kind"]) || !CLUE_SOURCES.has(value.source as SearchClue["source"])) return null;
  if (!isNonEmptyString(value.value, MAX_CLUE_LENGTH)) return null;
  return { kind: value.kind as SearchClue["kind"], value: value.value.trim(), source: value.source as SearchClue["source"] };
}

function validateBreakdown(value: unknown): EvidenceBreakdown | null {
  if (!isRecord(value) || !isNonEmptyString(value.clue, MAX_CLUE_LENGTH) || !isNonEmptyString(value.field, 80)) return null;
  if (typeof value.points !== "number" || !Number.isFinite(value.points) || !EVIDENCE_TYPES.has(value.type as EvidenceType)) return null;
  return { clue: value.clue, field: value.field, points: value.points, type: value.type as EvidenceType };
}

function validateStep(value: unknown, catalogIds: ReadonlySet<string>, warnings: string[]): CaseStep | null {
  if (!isRecord(value) || !isNonEmptyString(value.id, 128) || !STEP_TYPES.has(value.type as CaseStepType)) return null;
  if (!isNonEmptyString(value.labelKey, 128) || !isTimestamp(value.createdAt)) return null;
  const candidateIds = uniqueValidIds(value.candidateIds, catalogIds, warnings);
  return candidateIds ? { id: value.id, type: value.type as CaseStepType, labelKey: value.labelKey, candidateIds, createdAt: value.createdAt } : null;
}

function validateSnapshot(value: unknown, catalogIds: ReadonlySet<string>, stepIds: ReadonlySet<string>, warnings: string[]): ScoreSnapshot | null {
  if (!isRecord(value) || !isNonEmptyString(value.stepId, 128) || !stepIds.has(value.stepId) || !isRecord(value.scores) || !isRecord(value.breakdowns)) return null;
  const scores: Record<string, number> = {};
  const breakdowns: Record<string, EvidenceBreakdown[]> = {};
  for (const [itemId, score] of Object.entries(value.scores)) {
    if (!catalogIds.has(itemId)) { warnings.push(`Removed score for missing item ${itemId}.`); continue; }
    if (typeof score !== "number" || !Number.isFinite(score)) return null;
    scores[itemId] = score;
  }
  for (const [itemId, entries] of Object.entries(value.breakdowns)) {
    if (!catalogIds.has(itemId)) { warnings.push(`Removed breakdown for missing item ${itemId}.`); continue; }
    if (!Array.isArray(entries)) return null;
    const validated = entries.map(validateBreakdown);
    if (validated.some((entry) => entry === null)) return null;
    breakdowns[itemId] = validated as EvidenceBreakdown[];
  }
  return { stepId: value.stepId, scores, breakdowns };
}

export function resolveLocale(value: unknown): SupportedLocale {
  return LOCALES.has(value as SupportedLocale) ? value as SupportedLocale : "en";
}

export function createCaseIdentity(demoMode = false) {
  return {
    id: demoMode ? DEMO_CASE_ID : crypto.randomUUID(),
    timestamp: demoMode ? DEMO_TIMESTAMP : Date.now(),
  };
}

export function validateCasefile(value: unknown, catalogIds: ReadonlySet<string>): CasefileValidationResult {
  if (!isRecord(value)) return { ok: false, error: "invalid_payload" };
  if (value.version !== CASEFILE_VERSION) return { ok: false, error: "unsupported_version" };
  if (!isNonEmptyString(value.id, 128) || typeof value.originalDescription !== "string" || value.originalDescription.length > MAX_DESCRIPTION_LENGTH) return { ok: false, error: "invalid_payload" };
  if (!Array.isArray(value.clues) || !Array.isArray(value.steps) || !Array.isArray(value.scoreSnapshots)) return { ok: false, error: "invalid_payload" };
  if (!STATUSES.has(value.status as CaseStatus) || !isTimestamp(value.createdAt) || !isTimestamp(value.updatedAt) || value.updatedAt < value.createdAt) return { ok: false, error: "invalid_payload" };

  const clues = value.clues.map(validateClue);
  if (clues.some((clue) => clue === null)) return { ok: false, error: "invalid_payload" };

  const warnings: string[] = [];
  const candidateIds = uniqueValidIds(value.candidateIds, catalogIds, warnings);
  if (!candidateIds) return { ok: false, error: "invalid_payload" };
  const steps = value.steps.map((step) => validateStep(step, catalogIds, warnings));
  if (steps.some((step) => step === null)) return { ok: false, error: "invalid_payload" };
  const stepIds = new Set((steps as CaseStep[]).map((step) => step.id));
  if (stepIds.size !== steps.length) return { ok: false, error: "invalid_payload" };
  const snapshots = value.scoreSnapshots.map((snapshot) => validateSnapshot(snapshot, catalogIds, stepIds, warnings));
  if (snapshots.some((snapshot) => snapshot === null)) return { ok: false, error: "invalid_payload" };

  const optionalItem = (itemId: unknown) => itemId === undefined || (typeof itemId === "string" && catalogIds.has(itemId));
  if (!optionalItem(value.bestMatch) || !optionalItem(value.claimCandidateId)) return { ok: false, error: "invalid_payload" };

  return {
    ok: true,
    warnings,
    casefile: {
      version: CASEFILE_VERSION,
      id: value.id,
      locale: resolveLocale(value.locale),
      originalDescription: value.originalDescription,
      clues: clues as SearchClue[],
      candidateIds,
      ...(value.bestMatch ? { bestMatch: value.bestMatch as string } : {}),
      steps: steps as CaseStep[],
      scoreSnapshots: snapshots as ScoreSnapshot[],
      status: value.status as CaseStatus,
      ...(value.claimCandidateId ? { claimCandidateId: value.claimCandidateId as string } : {}),
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    },
  };
}

export function parseCasefile(serialized: string, catalogIds: ReadonlySet<string>): CasefileValidationResult {
  try {
    return validateCasefile(JSON.parse(serialized), catalogIds);
  } catch {
    return { ok: false, error: "invalid_json" };
  }
}
