import type { ChangedEvidence, RankDelta, RankMovement, ScoreSnapshot } from "../types/casefile";
import type { EvidenceBreakdown } from "../types/investigation";

function evidenceKey(entry: EvidenceBreakdown) {
  return `${entry.clue}\u0000${entry.field}\u0000${entry.type}`;
}

export function changedEvidence(previous: EvidenceBreakdown[] = [], current: EvidenceBreakdown[] = []): ChangedEvidence[] {
  const previousByKey = new Map(previous.map((entry) => [evidenceKey(entry), entry]));
  const currentByKey = new Map(current.map((entry) => [evidenceKey(entry), entry]));
  const changes: ChangedEvidence[] = [];
  for (const [key, entry] of currentByKey) {
    const before = previousByKey.get(key);
    if (!before) changes.push({ ...entry, change: "added" });
    else if (before.points !== entry.points) changes.push({ ...entry, change: "changed", previousPoints: before.points });
  }
  for (const [key, entry] of previousByKey) {
    if (!currentByKey.has(key)) changes.push({ ...entry, change: "removed" });
  }
  return changes.sort((left, right) => left.clue.localeCompare(right.clue) || left.field.localeCompare(right.field) || left.change.localeCompare(right.change));
}

function rankOf(ids: string[], itemId: string) {
  const index = ids.indexOf(itemId);
  return index < 0 ? undefined : index + 1;
}

export function calculateRankDeltas(previous: ScoreSnapshot, current: ScoreSnapshot, previousCandidateIds: string[], currentCandidateIds: string[]): RankDelta[] {
  const itemIds = [...new Set([...previousCandidateIds, ...currentCandidateIds])];
  return itemIds.map((itemId) => {
    const previousRank = rankOf(previousCandidateIds, itemId);
    const currentRank = rankOf(currentCandidateIds, itemId);
    const previousScore = previous.scores[itemId];
    const currentScore = current.scores[itemId];
    const movement: RankMovement = previousRank === undefined ? "entered"
      : currentRank === undefined ? "removed"
      : currentRank < previousRank ? "up"
      : currentRank > previousRank ? "down"
      : "same";
    return {
      item_id: itemId,
      previous_rank: previousRank,
      current_rank: currentRank,
      previous_score: previousScore,
      current_score: currentScore,
      score_delta: (currentScore ?? 0) - (previousScore ?? 0),
      movement,
      changed_evidence: changedEvidence(previous.breakdowns[itemId], current.breakdowns[itemId]),
    };
  }).sort((left, right) => (left.current_rank ?? Number.MAX_SAFE_INTEGER) - (right.current_rank ?? Number.MAX_SAFE_INTEGER) || left.item_id.localeCompare(right.item_id));
}
