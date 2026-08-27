import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowRight, CirclesFour, HandTap, Lightning } from "@phosphor-icons/react";
import itemsData from "./data/items.json";
import type { LostItem, SearchInput, SearchResult } from "./types/item";
import { rankItems, searchItems, selectRelevantResults } from "./lib/search";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SearchFilters } from "./components/SearchFilters";
import { ItemCard } from "./components/ItemCard";
import { ItemDetail } from "./components/ItemDetail";
import { EmptyState } from "./components/EmptyState";
import { AgentActivity, type ActivityEntry } from "./components/AgentActivity";
import { ClaimModal } from "./components/ClaimModal";
import { InvestigationPanel, InvestigationStandby } from "./components/InvestigationPanel";
import { compareItems, compareItemsWithClues, descriptionToClues } from "./lib/matching";
import { useWebMCP } from "./hooks/useWebMCP";
import type { MatchResult, UserDescription } from "./types/item";
import type { InvestigationSession } from "./types/investigation";
import { createInvestigationSession, createSearchStep } from "./lib/investigation";
import { getSearchFacets } from "./lib/facets";
import { buildKeysInvestigation, KEYS_DEMO_FOLLOWUP, KEYS_DEMO_INITIAL_QUERY } from "./lib/demo";

const items = itemsData as LostItem[];
const recentIds = ["LF-003", "LF-007", "LF-015", "LF-019"];
const DEFAULT_DEMO_QUERY = `${KEYS_DEMO_INITIAL_QUERY}. ${KEYS_DEMO_FOLLOWUP}`;
const demoMode = new URLSearchParams(window.location.search).get("demo") === "true";

export function App() {
  const galleryRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [claimCandidate, setClaimCandidate] = useState<LostItem | null>(null);
  const [claimMatch, setClaimMatch] = useState<MatchResult | undefined>();
  const [claimConfirmed, setClaimConfirmed] = useState(false);
  const [investigation, setInvestigation] = useState<InvestigationSession | null>(null);
  const [evidence, setEvidence] = useState<MatchResult | undefined>();

  const filtered = useMemo(() => investigation ? items : searchItems(items, { query, category: category === "all" ? undefined : category }), [query, category, investigation]);
  const facets = useMemo(() => investigation ? getSearchFacets(investigation.candidateIds.map((id) => items.find((item) => item.id === id)!).filter(Boolean), investigation.clues) : [], [investigation]);
  const recent = recentIds.map((id) => items.find((item) => item.id === id)!).filter(Boolean);
  const browse = useCallback(() => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const addActivity = useCallback((entry: ActivityEntry) => setActivity((current) => [...current.filter((item) => item.tool !== entry.tool), entry]), []);
  const highlight = useCallback((id: string) => {
    setHighlightedItem(id);
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    window.setTimeout(() => setHighlightedItem((current) => current === id ? null : current), 1500);
  }, []);
  const startClaim = useCallback((item: LostItem, description?: UserDescription) => {
    const [match] = compareItems([item], description ?? {
      query: item.name,
      category: item.category,
      color: item.color[0],
      features: item.distinctive_features,
    });
    setSelectedItem(null); setClaimCandidate(item); setClaimMatch(match); setClaimConfirmed(false);
  }, []);
  const showAgentSearch = useCallback((input: SearchInput, results: SearchResult[]) => {
    const visibleQuery = input.query?.trim() || [input.color, input.category, input.location, ...(input.features ?? [])].filter(Boolean).join(" ");
    setClaimCandidate(null);
    setClaimConfirmed(false);
    setCategory("all");
    setQuery(visibleQuery);
    browse();
    if (results[0]) window.setTimeout(() => highlight(results[0].item.id), 100);
  }, [browse, highlight]);
  const webmcpCallbacks = useMemo(() => ({
    onActivity: addActivity,
    onSearch: showAgentSearch,
    onHighlight: highlight,
    onClaim: startClaim,
    onInvestigation: (session: InvestigationSession | null) => { setInvestigation(session); if (!session) setEvidence(undefined); },
    onEvidence: setEvidence,
  }), [addActivity, highlight, showAgentSearch, startClaim]);
  const { supported: webmcpSupported, reset: resetWebMCP } = useWebMCP(items, webmcpCallbacks);

  const runAgentSearch = useCallback((description: string, requestClaim = false) => {
    const naturalLanguage = description.trim() || DEFAULT_DEMO_QUERY;
    const ranked = selectRelevantResults(rankItems(items, { query: naturalLanguage }, { strictFilters: false }));
    const clues = descriptionToClues({ query: naturalLanguage });
    const candidateIds = ranked.map((result) => result.item.id);
    const baseSession = createInvestigationSession({ id: demoMode ? "demo-session" : crypto.randomUUID(), originalQuery: naturalLanguage, clues, candidateIds, label: "Searching catalog", createdAt: demoMode ? 1 : undefined });
    const usefulFacets = getSearchFacets(ranked.map((result) => result.item), clues);
    const [best] = compareItemsWithClues(ranked.map((result) => result.item), clues);
    const timeline = [...baseSession.searches];
    if (ranked.length > 1) timeline.push(createSearchStep(usefulFacets[0] ? `Useful clue · ${usefulFacets[0].field}` : "Looking for useful clues", candidateIds));
    if (best) timeline.push(createSearchStep(`Compared evidence · ${best.item.id}`, candidateIds));
    if (best && requestClaim) timeline.push(createSearchStep("Waiting for you · Human confirmation", [best.item.id]));
    const session: InvestigationSession = {
      ...baseSession,
      searches: timeline,
      bestMatch: best?.item.id,
      status: best ? (requestClaim ? "confirmation_required" : "possible_match") : "needs_clue",
    };
    setActivity([]);
    setCategory("all");
    setQuery(naturalLanguage);
    setSelectedItem(null);
    setClaimCandidate(null);
    setClaimConfirmed(false);
    setInvestigation(session);
    setEvidence(best);
    browse();
    if (!best) {
      addActivity({ tool: "search_lost_items", message: "No matching candidates", state: "done" });
      return;
    }
    addActivity({ tool: "search_lost_items", message: `Ranked ${ranked.length} candidates`, state: "done" });
    if (usefulFacets[0]) addActivity({ tool: "get_search_facets", message: usefulFacets[0].question_hint, state: "done" });
    addActivity({ tool: "compare_items", message: `${Math.round(best.score * 100)}% match · ${best.item.id}`, state: "done" });
    highlight(best.item.id);
    if (requestClaim) {
      addActivity({ tool: "request_claim", message: "Waiting for human", state: "active" });
      startClaim(best.item, { query: naturalLanguage });
    }
  }, [addActivity, browse, highlight, startClaim]);

  const runKeysDemo = useCallback(() => {
    const result = buildKeysInvestigation(items, { id: "demo-session", startTime: 1 });
    if (!result) return;
    const visibleQuery = `${KEYS_DEMO_INITIAL_QUERY}. ${KEYS_DEMO_FOLLOWUP}`;
    setActivity([
      { tool: "search_lost_items", message: `${result.session.searches[0].candidateCount} key candidates`, state: "done" },
      { tool: "get_search_facets", message: result.facets[0]?.question_hint ?? "Ready to compare", state: "done" },
      { tool: "compare_items", message: `${Math.round(result.evidence.score * 100)}% match · ${result.evidence.item.id}`, state: "done" },
      { tool: "get_match_evidence", message: `${result.evidence.match_strength} · ${result.evidence.item.id}`, state: "done" },
      { tool: "request_claim", message: "Waiting for human", state: "active" },
    ]);
    setQuery(visibleQuery);
    setCategory("all");
    setSelectedItem(null);
    setInvestigation(result.session);
    setEvidence(result.evidence);
    setClaimCandidate(result.evidence.item);
    setClaimMatch(result.evidence);
    setClaimConfirmed(false);
    browse();
    highlight(result.evidence.item.id);
  }, [browse, highlight]);

  const resetInvestigation = useCallback(() => {
    resetWebMCP();
    setInvestigation(null);
    setEvidence(undefined);
    setActivity([]);
    setHighlightedItem(null);
    setClaimCandidate(null);
    setClaimMatch(undefined);
    setClaimConfirmed(false);
    setQuery("");
    setCategory("all");
  }, [resetWebMCP]);

  const previewDemo = useCallback(() => query.trim() ? runAgentSearch(query, true) : runKeysDemo(), [query, runAgentSearch, runKeysDemo]);

  return (
    <div className="app-shell">
      <Header onBrowse={browse} />
      <main>
        <Hero onBrowse={browse} onDemo={previewDemo} />
        <section className="recent-section" aria-labelledby="recent-title">
          <div className="section-heading compact"><div><span className="section-kicker">Fresh reports</span><h2 id="recent-title">Recently found</h2></div><button onClick={browse}>View all 30 <ArrowRight /></button></div>
          <div className="recent-grid">{recent.map((item) => <ItemCard key={item.id} item={item} highlighted={false} onOpen={() => setSelectedItem(item)} />)}</div>
        </section>
        <section className="how-section" id="how-it-works">
          <div className="section-heading light"><div><span className="section-kicker">Human + agent</span><h2>A shorter path back to what’s yours.</h2></div><p>The same catalog is designed for people to browse and for browser agents to query through structured WebMCP tools.</p></div>
          <div className="steps">
            <article><span>01</span><CirclesFour /><h3>Search</h3><p>Your agent searches structured item data, not screenshots.</p></article>
            <article><span>02</span><Lightning /><h3>Compare</h3><p>Deterministic clues explain why one item stands out.</p></article>
            <article><span>03</span><HandTap /><h3>You decide</h3><p>The agent can request a claim. Only you can confirm it.</p></article>
          </div>
        </section>
        <section className="gallery-section" ref={galleryRef} aria-labelledby="gallery-title">
          <div className="section-heading"><div><span className="section-kicker">Community catalog</span><h2 id="gallery-title">Found items</h2></div><p><strong>{items.length} items</strong> are currently waiting to find their owners.</p></div>
          <SearchFilters query={query} category={category} onQuery={setQuery} onCategory={setCategory} onAgentSearch={() => runAgentSearch(query)} />
          <div className={investigation || demoMode ? "investigation-layout active" : "investigation-layout"}>
            <div className="catalog-column">
              <div className="results-meta"><span>{investigation ? investigation.candidateIds.length : filtered.length} {investigation?.candidateIds.length === 1 || (!investigation && filtered.length === 1) ? "match" : "matches"}</span><span>Updated Aug 27, 2026</span></div>
              {filtered.length ? <div className="item-grid">{filtered.map((item) => {
                const candidateState = investigation ? investigation.bestMatch === item.id ? "best" : investigation.candidateIds.includes(item.id) ? "candidate" : "dimmed" : undefined;
                return <ItemCard key={item.id} item={item} highlighted={highlightedItem === item.id} candidateState={candidateState} onOpen={() => setSelectedItem(item)} />;
              })}</div> : <EmptyState onReset={() => { setQuery(""); setCategory("all"); }} />}
            </div>
            {investigation && <InvestigationPanel session={investigation} facets={facets} evidence={evidence} onReset={resetInvestigation} onReview={(itemId) => setSelectedItem(items.find((item) => item.id === itemId) ?? null)} />}
            {!investigation && demoMode && <InvestigationStandby onRun={runKeysDemo} />}
          </div>
        </section>
      </main>
      <footer><div className="brand footer-brand">Agent Lost <i>&amp;</i> Found</div><p>Agents search. <strong>Humans decide.</strong></p><span>Built for the agentic web.</span></footer>
      <AgentActivity supported={webmcpSupported} entries={activity} onDemo={previewDemo} />
      {selectedItem && <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} onClaim={() => startClaim(selectedItem)} />}
      {claimCandidate && <ClaimModal item={claimCandidate} match={claimMatch} confirmed={claimConfirmed} onCancel={() => { setClaimCandidate(null); setClaimConfirmed(false); }} onConfirm={() => { setClaimConfirmed(true); setInvestigation((current) => current ? { ...current, status: "completed" } : current); setActivity((current) => current.map((entry) => entry.tool === "request_claim" ? { ...entry, message: "Confirmed by human", state: "done" } : entry)); }} />}
    </div>
  );
}
