import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem, UserDescription } from "../types/item";
import { compareItems } from "./matching";

const items = itemsData as LostItem[];
const heroDescription: UserDescription = {
  query: "yellow umbrella with a duck and wooden handle",
  category: "umbrella",
  color: "yellow",
  date: "yesterday",
  features: ["wooden handle", "duck"],
};

describe("compareItems", () => {
  it("calculates LF-003 as the best hero match", () => {
    const [best] = compareItems(items.slice(0, 5), heroDescription);
    expect(best.item.id).toBe("LF-003");
    expect(best.score).toBeGreaterThanOrEqual(0.85);
    expect(best.matched_features).toEqual(expect.arrayContaining(["umbrella", "yellow", "wooden", "handle", "duck"]));
    expect(best.missing_features).toEqual([]);
  });

  it("is deterministic across repeated runs", () => {
    const first = compareItems(items, heroDescription).map(({ item, score }) => [item.id, score]);
    const second = compareItems(items, heroDescription).map(({ item, score }) => [item.id, score]);
    expect(second).toEqual(first);
  });

  it("reports clues that are not present", () => {
    const result = compareItems([items[0]], { category: "umbrella", color: "yellow", features: ["duck"] })[0];
    expect(result.missing_features).toEqual(expect.arrayContaining(["yellow", "duck"]));
  });
});
