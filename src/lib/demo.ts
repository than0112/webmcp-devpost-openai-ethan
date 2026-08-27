import type { LostItem, MatchResult, SearchResult } from "../types/item";
import type { InvestigationSession, SearchFacet } from "../types/investigation";
import { getSearchFacets } from "./facets";
import { createInvestigationSession, createSearchStep, mergeSearchClues } from "./investigation";
import { compareItemsWithClues, descriptionToClues } from "./matching";
import { rankItems, selectRelevantResults } from "./search";

export const KEYS_DEMO_INITIAL_QUERY = "I lost something on a key ring";
export const KEYS_DEMO_FOLLOWUP = "It had a small bear charm";

export interface KeysDemoResult {
  session: InvestigationSession;
  evidence: MatchResult;
  facets: SearchFacet[];
  ranked: SearchResult[];
}

export function buildKeysInvestigation(items: LostItem[], options: { id?: string; startTime?: number } = {}): KeysDemoResult | null {
  const startTime = options.startTime ?? Date.now();
  const initialClues = descriptionToClues({ query: KEYS_DEMO_INITIAL_QUERY });
  const initialRanked = selectRelevantResults(rankItems(items, { query: KEYS_DEMO_INITIAL_QUERY }, { strictFilters: false }));
  const initialIds = initialRanked.map((result) => result.item.id);
  const facets = getSearchFacets(initialRanked.map((result) => result.item), initialClues);
  const followupClues = descriptionToClues({ features: ["bear charm"] });
  const mergedClues = mergeSearchClues(initialClues, followupClues);
  const refinedQuery = mergedClues.filter((clue) => clue.kind !== "negative").map((clue) => clue.value).join(" ");
  const refinedRanked = selectRelevantResults(rankItems(initialRanked.map((result) => result.item), { query: refinedQuery }, { strictFilters: false }));
  const refinedIds = refinedRanked.map((result) => result.item.id);
  const [evidence] = compareItemsWithClues(refinedRanked.map((result) => result.item), mergedClues);
  if (!evidence) return null;

  const base = createInvestigationSession({ id: options.id ?? crypto.randomUUID(), originalQuery: KEYS_DEMO_INITIAL_QUERY, clues: initialClues, candidateIds: initialIds, label: "Searching catalog", createdAt: startTime });
  const facetLabel = facets[0] ? `Useful clue · ${facets[0].field}` : "Looking for useful clues";
  const session: InvestigationSession = {
    ...base,
    clues: mergedClues,
    candidateIds: refinedIds,
    bestMatch: evidence.item.id,
    status: "confirmation_required",
    searches: [
      ...base.searches,
      createSearchStep(facetLabel, initialIds, startTime + 1),
      createSearchStep(`Bear charm added · ${refinedIds.length} strongest candidates`, refinedIds, startTime + 2),
      createSearchStep(`Compared evidence · ${evidence.item.id}`, refinedIds, startTime + 3),
      createSearchStep("Waiting for you · Human confirmation", [evidence.item.id], startTime + 4),
    ],
  };
  return { session, evidence, facets, ranked: refinedRanked };
}

