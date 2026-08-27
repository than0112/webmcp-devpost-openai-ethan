import type { LostItem, SearchInput } from "../types/item";

export const DATASET_TODAY = "2026-08-27";

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

export function resolveDate(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = normalize(value);
  if (normalized === "yesterday") return "2026-08-26";
  if (normalized === "today") return DATASET_TODAY;
  return value;
}

function itemText(item: LostItem) {
  return normalize([
    item.id,
    item.name,
    item.category,
    item.color.join(" "),
    item.description,
    item.distinctive_features.join(" "),
    item.found_location,
    item.found_area,
    item.tags.join(" "),
  ].join(" "));
}

export function searchItems(items: LostItem[], input: SearchInput): LostItem[] {
  const queryTokens = normalize(input.query ?? "").split(" ").filter(Boolean);
  const category = normalize(input.category ?? "");
  const color = normalize(input.color ?? "");
  const location = normalize(input.location ?? "");
  const date = resolveDate(input.date);

  return items.filter((item) => {
    const haystack = itemText(item);
    const categoryMatch = !category || normalize(item.category).includes(category) || haystack.includes(category);
    const colorMatch = !color || item.color.some((value) => normalize(value).includes(color));
    const locationMatch = !location || normalize(`${item.found_location} ${item.found_area} ${item.tags.join(" ")}`).includes(location);
    const dateMatch = !date || item.found_date === date;
    const queryMatch = queryTokens.length === 0 || queryTokens.every((token) => haystack.includes(token));
    return categoryMatch && colorMatch && locationMatch && dateMatch && queryMatch;
  });
}
