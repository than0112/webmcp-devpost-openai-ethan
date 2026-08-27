import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { resolveDate, searchItems } from "./search";

const items = itemsData as LostItem[];

describe("searchItems", () => {
  it("finds the hero item from structured attributes", () => {
    const results = searchItems(items, { category: "umbrella", color: "yellow", date: "yesterday" });
    expect(results.map((item) => item.id)).toEqual(["LF-003"]);
  });

  it("searches metadata instead of image content", () => {
    expect(searchItems(items, { query: "bear" }).map((item) => item.id)).toEqual(["LF-012", "LF-017", "LF-024"]);
  });

  it("resolves demo-relative dates deterministically", () => {
    expect(resolveDate("yesterday")).toBe("2026-08-26");
  });
});
