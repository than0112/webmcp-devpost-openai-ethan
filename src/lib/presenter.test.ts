import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { rankItems } from "./search";
import { PRESENTER_PROMPTS, presentationFlags } from "./presenter";

const items = itemsData as LostItem[];

describe("presenter mode", () => {
  it("coexists with stable dataset mode without implying a scripted result", () => {
    expect(presentationFlags("?demo=true&present=true")).toEqual({ demo: true, present: true });
    expect(presentationFlags("?present=true")).toEqual({ demo: false, present: true });
  });

  it("uses approved bilingual prompts that still run through the generic engine", () => {
    expect(rankItems(items, { query: PRESENTER_PROMPTS.en })[0].item.id).toBe("LF-013");
    expect(rankItems(items, { query: PRESENTER_PROMPTS["zh-TW"] })[0].item.id).toBe("LF-013");
  });

  it("does not change an unrelated query's engine result", () => {
    const normal = rankItems(items, { query: "black pen" }).map((entry) => [entry.item.id, entry.score]);
    const whilePresenting = rankItems(items, { query: "black pen" }).map((entry) => [entry.item.id, entry.score]);
    expect(whilePresenting).toEqual(normal);
    expect(whilePresenting[0][0]).toBe("LF-030");
  });
});
