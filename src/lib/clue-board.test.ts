import { describe, expect, it } from "vitest";
import type { SearchClue } from "../types/investigation";
import { clueActionReason, groupClues } from "./clue-board";

const clues: SearchClue[] = [
  { kind: "color", value: "brown", source: "query" },
  { kind: "feature", value: "snap tab", source: "human" },
  { kind: "negative", value: "card holder", source: "human" },
];

describe("clue board model", () => {
  it("separates positive, negative, and unknown clues", () => {
    const groups = groupClues(clues, ["snap tab"]);
    expect(groups.positive.map((clue) => clue.value)).toEqual(["brown"]);
    expect(groups.unknown.map((clue) => clue.value)).toEqual(["snap tab"]);
    expect(groups.negative.map((clue) => clue.value)).toEqual(["card holder"]);
  });

  it("disables empty and duplicate actions without item-specific logic", () => {
    expect(clueActionReason(clues, { kind: "color", value: " BROWN ", source: "human" }, "add")).toBe("duplicate");
    expect(clueActionReason(clues, { kind: "feature", value: "", source: "human" }, "add")).toBe("invalid");
    expect(clueActionReason(clues, { kind: "feature", value: "card holder", source: "human" }, "reject")).toBe("duplicate");
    expect(clueActionReason(clues, { kind: "feature", value: "zipper", source: "human" }, "add")).toBeNull();
  });
});
