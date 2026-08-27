import { MagnifyingGlass } from "@phosphor-icons/react";
export function EmptyState({ onReset }: { onReset: () => void }) {
  return <div className="empty-state"><MagnifyingGlass /><h3>No matching items found.</h3><p>Try removing one detail.</p><button onClick={onReset}>Clear search</button></div>;
}
