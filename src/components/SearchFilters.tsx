import { MagnifyingGlass, Robot, X } from "@phosphor-icons/react";

export const categories = [
  ["all", "All"], ["umbrella", "Umbrellas"], ["bag", "Bags"], ["wallet", "Wallets"],
  ["keys", "Keys"], ["audio", "Audio"], ["glasses", "Glasses"], ["bottle", "Bottles"],
  ["accessory", "Accessories"], ["other", "Other"],
] as const;

export function SearchFilters({ query, category, onQuery, onCategory, onAgentSearch }: {
  query: string; category: string; onQuery: (value: string) => void; onCategory: (value: string) => void; onAgentSearch: () => void;
}) {
  return (
    <div className="filters">
      <form className="agent-search-row" onSubmit={(event) => { event.preventDefault(); onAgentSearch(); }}>
        <label className="search-box">
          <MagnifyingGlass weight="bold" />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Describe anything: brown wallet, round glasses, house keys…" />
          {query && <button type="button" onClick={() => onQuery("")} aria-label="Clear search"><X /></button>}
        </label>
        <button className="agent-search-button" type="submit" disabled={!query.trim()}><Robot weight="fill" /> Run agent search</button>
      </form>
      <div className="category-pills" role="group" aria-label="Filter by category">
        {categories.map(([value, label]) => <button key={value} className={category === value ? "active" : ""} onClick={() => onCategory(value)}>{label}</button>)}
      </div>
    </div>
  );
}
