import { MagnifyingGlass, X } from "@phosphor-icons/react";

export const categories = [
  ["all", "All"], ["umbrella", "Umbrellas"], ["bag", "Bags"], ["wallet", "Wallets"],
  ["keys", "Keys"], ["audio", "Audio"], ["glasses", "Glasses"], ["bottle", "Bottles"],
  ["accessory", "Accessories"], ["other", "Other"],
] as const;

export function SearchFilters({ query, category, onQuery, onCategory }: {
  query: string; category: string; onQuery: (value: string) => void; onCategory: (value: string) => void;
}) {
  return (
    <div className="filters">
      <label className="search-box">
        <MagnifyingGlass weight="bold" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search by color, place, or detail…" />
        {query && <button onClick={() => onQuery("")} aria-label="Clear search"><X /></button>}
      </label>
      <div className="category-pills" role="group" aria-label="Filter by category">
        {categories.map(([value, label]) => <button key={value} className={category === value ? "active" : ""} onClick={() => onCategory(value)}>{label}</button>)}
      </div>
    </div>
  );
}
