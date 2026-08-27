import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CirclesFour, HandTap, Lightning } from "@phosphor-icons/react";
import itemsData from "./data/items.json";
import type { LostItem, SearchInput, SearchResult } from "./types/item";
import { rankItems, searchItems } from "./lib/search";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SearchFilters } from "./components/SearchFilters";
import { ItemCard } from "./components/ItemCard";
import { ItemDetail } from "./components/ItemDetail";
import { EmptyState } from "./components/EmptyState";
import { AgentActivity, type ActivityEntry } from "./components/AgentActivity";
import { ClaimModal } from "./components/ClaimModal";
import { compareItems } from "./lib/matching";
import { useWebMCP } from "./hooks/useWebMCP";
import type { MatchResult, UserDescription } from "./types/item";

const items = itemsData as LostItem[];
const recentIds = ["LF-003", "LF-007", "LF-015", "LF-019"];
const DEFAULT_DEMO_QUERY = "yellow umbrella with a duck and wooden handle";

export function App() {
  const galleryRef = useRef<HTMLElement>(null);
  const agentTimers = useRef<number[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [claimCandidate, setClaimCandidate] = useState<LostItem | null>(null);
  const [claimMatch, setClaimMatch] = useState<MatchResult | undefined>();
  const [claimConfirmed, setClaimConfirmed] = useState(false);

  const filtered = useMemo(() => searchItems(items, { query, category: category === "all" ? undefined : category }), [query, category]);
  const recent = recentIds.map((id) => items.find((item) => item.id === id)!).filter(Boolean);
  const browse = useCallback(() => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const clearAgentTimers = useCallback(() => {
    agentTimers.current.forEach((timer) => window.clearTimeout(timer));
    agentTimers.current = [];
  }, []);
  useEffect(() => clearAgentTimers, [clearAgentTimers]);
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
    clearAgentTimers();
    setClaimCandidate(null);
    setClaimConfirmed(false);
    setCategory("all");
    setQuery(visibleQuery);
    browse();
    if (results[0]) window.setTimeout(() => highlight(results[0].item.id), 100);
  }, [browse, clearAgentTimers, highlight]);
  const webmcpCallbacks = useMemo(() => ({ onActivity: addActivity, onSearch: showAgentSearch, onHighlight: highlight, onClaim: startClaim }), [addActivity, highlight, showAgentSearch, startClaim]);
  const webmcpSupported = useWebMCP(items, webmcpCallbacks);

  const runAgentSearch = useCallback((description: string, requestClaim = false) => {
    const naturalLanguage = description.trim() || DEFAULT_DEMO_QUERY;
    const ranked = rankItems(items, { query: naturalLanguage });
    const best = ranked[0];
    clearAgentTimers();
    setActivity([]);
    setCategory("all");
    setQuery(naturalLanguage);
    setSelectedItem(null);
    setClaimCandidate(null);
    setClaimConfirmed(false);
    browse();
    if (!best) {
      addActivity({ tool: "search_lost_items", message: "No matching candidates", state: "done" });
      return;
    }
    const schedule = (callback: () => void, delay: number) => {
      agentTimers.current.push(window.setTimeout(callback, delay));
    };
    schedule(() => addActivity({ tool: "search_lost_items", message: `Ranked ${ranked.length} candidates`, state: "done" }), 250);
    schedule(() => addActivity({ tool: "compare_items", message: `${Math.round(best.confidence * 100)}% match · ${best.item.id}`, state: "done" }), 850);
    schedule(() => {
      highlight(best.item.id);
      addActivity({ tool: "get_item_details", message: `Highlighting ${best.item.id}`, state: "done" });
    }, 1450);
    if (requestClaim) schedule(() => {
      addActivity({ tool: "request_claim", message: "Waiting for human", state: "active" });
      startClaim(best.item, { query: naturalLanguage });
    }, 2200);
  }, [addActivity, browse, clearAgentTimers, highlight, startClaim]);

  const previewDemo = useCallback(() => runAgentSearch(query || DEFAULT_DEMO_QUERY, true), [query, runAgentSearch]);

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
          <div className="results-meta"><span>{filtered.length} {filtered.length === 1 ? "match" : "matches"}</span><span>Updated Aug 27, 2026</span></div>
          {filtered.length ? <div className="item-grid">{filtered.map((item) => <ItemCard key={item.id} item={item} highlighted={highlightedItem === item.id} onOpen={() => setSelectedItem(item)} />)}</div> : <EmptyState onReset={() => { setQuery(""); setCategory("all"); }} />}
        </section>
      </main>
      <footer><div className="brand footer-brand">Agent Lost <i>&amp;</i> Found</div><p>Agents search. <strong>Humans decide.</strong></p><span>Built for the agentic web.</span></footer>
      <AgentActivity supported={webmcpSupported} entries={activity} onDemo={previewDemo} />
      {selectedItem && <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} onClaim={() => startClaim(selectedItem)} />}
      {claimCandidate && <ClaimModal item={claimCandidate} match={claimMatch} confirmed={claimConfirmed} onCancel={() => { setClaimCandidate(null); setClaimConfirmed(false); }} onConfirm={() => { setClaimConfirmed(true); setActivity((current) => current.map((entry) => entry.tool === "request_claim" ? { ...entry, message: "Confirmed by human", state: "done" } : entry)); }} />}
    </div>
  );
}
