import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { rankItems, resolveDate, searchItems } from "./search";

const items = itemsData as LostItem[];

describe("searchItems", () => {
  it("finds the hero item from structured attributes", () => {
    const results = searchItems(items, { category: "umbrella", color: "yellow", date: "yesterday" });
    expect(results.map((item) => item.id)).toEqual(["LF-003"]);
  });

  it("searches metadata instead of image content", () => {
    expect(searchItems(items, { query: "bear" }).map((item) => item.id)).toEqual(["LF-012", "LF-017", "LF-024"]);
  });

  it.each([
    ["yellow umbrella with a duck", "LF-003"],
    ["black backpack", "LF-007"],
    ["green backpack", "LF-008"],
    ["brown wallet", "LF-013"],
    ["house keys", "LF-015"],
    ["keys with a bear keychain", "LF-017"],
    ["white wireless earbuds", "LF-019"],
    ["round glasses", "LF-021"],
    ["blue water bottle", "LF-023"],
    ["gray scarf", "LF-027"],
    ["black pen", "LF-030"],
  ])("ranks '%s' as %s without an ID-specific branch", (query, expectedId) => {
    expect(rankItems(items, { query })[0]?.item.id).toBe(expectedId);
  });

  it("can retrieve every catalog item generically by its natural-language name", () => {
    for (const item of items) {
      expect(rankItems(items, { query: item.name })[0]?.item.id).toBe(item.id);
    }
  });

  it("returns multiple ranked candidates when clues point to different items", () => {
    const ids = rankItems(items, { query: "black backpack with a bear keychain" }).slice(0, 2).map((result) => result.item.id);
    expect(ids).toEqual(["LF-017", "LF-007"]);
  });

  it("resolves demo-relative dates deterministically", () => {
    expect(resolveDate("yesterday")).toBe("2026-08-26");
  });
});
