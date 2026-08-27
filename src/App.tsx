import { useMemo, useRef, useState } from "react";
import { ArrowRight, CirclesFour, HandTap, Lightning } from "@phosphor-icons/react";
import itemsData from "./data/items.json";
import type { LostItem } from "./types/item";
import { searchItems } from "./lib/search";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { SearchFilters } from "./components/SearchFilters";
import { ItemCard } from "./components/ItemCard";
import { ItemDetail } from "./components/ItemDetail";
import { EmptyState } from "./components/EmptyState";

const items = itemsData as LostItem[];
const recentIds = ["LF-003", "LF-007", "LF-015", "LF-019"];

export function App() {
  const galleryRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  const filtered = useMemo(() => searchItems(items, { query, category: category === "all" ? undefined : category }), [query, category]);
  const recent = recentIds.map((id) => items.find((item) => item.id === id)!).filter(Boolean);
  const browse = () => galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const previewDemo = () => {
    setCategory("umbrella");
    setQuery("yellow duck wooden handle");
    setHighlightedItem("LF-003");
    browse();
    window.setTimeout(() => document.getElementById("LF-003")?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
    window.setTimeout(() => setHighlightedItem(null), 1800);
  };

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
          <SearchFilters query={query} category={category} onQuery={setQuery} onCategory={setCategory} />
          <div className="results-meta"><span>{filtered.length} {filtered.length === 1 ? "match" : "matches"}</span><span>Updated Aug 27, 2026</span></div>
          {filtered.length ? <div className="item-grid">{filtered.map((item) => <ItemCard key={item.id} item={item} highlighted={highlightedItem === item.id} onOpen={() => setSelectedItem(item)} />)}</div> : <EmptyState onReset={() => { setQuery(""); setCategory("all"); }} />}
        </section>
      </main>
      <footer><div className="brand footer-brand">Agent Lost <i>&amp;</i> Found</div><p>Agents search. <strong>Humans decide.</strong></p><span>Built for the agentic web.</span></footer>
      {selectedItem && <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} onClaim={() => {}} />}
    </div>
  );
}
