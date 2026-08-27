import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { evaluateItemEvidence, getMatchStrength } from "./evidence";

const items = itemsData as LostItem[];
const bear = items.find((item) => item.id === "LF-017")!;
const greenBackpack = items.find((item) => item.id === "LF-008")!;

describe("evidence", () => {
  it("marks confirmed metadata as matched", () => expect(evaluateItemEvidence(bear, [{ kind: "feature", value: "bear", source: "human" }]).matched).toEqual(["bear"]));
  it("marks absent free-text features as unknown", () => expect(evaluateItemEvidence(bear, [{ kind: "feature", value: "engraved initials", source: "human" }]).unknown).toEqual(["engraved initials"]));
  it("marks a structured color conflict as a contradiction", () => {
    const result = evaluateItemEvidence(greenBackpack, [{ kind: "color", value: "black", source: "human" }]);
    expect(result.contradictions).toEqual(["black"]);
    expect(result.penalty).toBe(20);
  });
  it("marks a structured category conflict as a contradiction", () => {
    const result = evaluateItemEvidence(bear, [{ kind: "category", value: "wallet", source: "human" }]);
    expect(result.score_breakdown).toContainEqual(expect.objectContaining({ points: -40, type: "contradiction" }));
  });
  it("marks a structured location conflict as a contradiction", () => {
    const result = evaluateItemEvidence(bear, [{ kind: "location", value: "parking garage", source: "human" }]);
    expect(result.score_breakdown).toContainEqual(expect.objectContaining({ points: -15, type: "contradiction" }));
  });
  it("marks a structured date conflict as a contradiction", () => {
    const result = evaluateItemEvidence(bear, [{ kind: "date", value: "2026-08-26", source: "human" }]);
    expect(result.score_breakdown).toContainEqual(expect.objectContaining({ points: -15, type: "contradiction" }));
  });
  it("penalizes an explicitly excluded detail when present", () => {
    const result = evaluateItemEvidence(bear, [{ kind: "negative", value: "bear", source: "human" }]);
    expect(result.penalty).toBe(30);
  });
  it("does not penalize an excluded detail that is absent", () => expect(evaluateItemEvidence(bear, [{ kind: "negative", value: "heart", source: "human" }]).penalty).toBe(0));
  it("deduplicates normalized clues", () => expect(evaluateItemEvidence(bear, [
    { kind: "feature", value: "Bear", source: "human" },
    { kind: "feature", value: "bear", source: "agent" },
  ]).score_breakdown).toHaveLength(1));
  it("uses the approved match-strength thresholds", () => {
    expect(getMatchStrength(0.85)).toBe("strong");
    expect(getMatchStrength(0.65)).toBe("possible");
    expect(getMatchStrength(0.4)).toBe("weak");
    expect(getMatchStrength(0.39)).toBe("unlikely");
  });
});
