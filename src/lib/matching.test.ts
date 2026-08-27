import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem, UserDescription } from "../types/item";
import { compareItem, compareItems, scoreFromEvidence } from "./matching";

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

  it("ranks the bear keychain from progressive structured clues", () => {
    const keyItems = items.filter((item) => item.category === "keys");
    expect(compareItems(keyItems, { category: "keys", color: "brown", features: ["bear"] })[0].item.id).toBe("LF-017");
  });

  it("reports absent free-text evidence as unknown", () => {
    expect(compareItem(items[16], { features: ["engraved initials"] }).unknown).toEqual(["engraved initials"]);
  });

  it("reports structured conflict separately from unknown", () => {
    const result = compareItem(items[7], { color: "black", features: ["laptop sleeve"] });
    expect(result.contradictions).toEqual(["black"]);
    expect(result.unknown).toEqual(["laptop sleeve"]);
  });

  it("applies explicit negative clues to ranking", () => {
    const result = compareItem(items[16], { category: "keys", features: ["silver ring"] }, ["bear"]);
    expect(result.contradictions).toEqual(["bear"]);
    expect(result.score_breakdown).toContainEqual(expect.objectContaining({ clue: "bear", points: -30, type: "contradiction" }));
  });

  it("clamps a penalty-dominated score to zero", () => expect(scoreFromEvidence(10, 50, 30)).toBe(0));

  it("uses the same evidence breakdown returned to callers", () => {
    const result = compareItem(items[16], { category: "keys", color: "brown", features: ["bear"] });
    expect(result.score_breakdown.reduce((total, entry) => total + entry.points, 0)).toBe(70);
    expect(result.score).toBe(1);
  });

  it("is stable when candidate input order changes", () => {
    const description = { category: "keys", features: ["bear"] };
    expect(compareItems([...items].reverse(), description).map((result) => result.item.id)).toEqual(compareItems(items, description).map((result) => result.item.id));
  });
});
