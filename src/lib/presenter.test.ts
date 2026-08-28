import { describe, expect, it, vi } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { rankItems } from "./search";
import { copyPresenterPrompt, PRESENTER_PROMPTS, presentationFlags } from "./presenter";

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

  it("copies either prompt without requiring a React render-state change", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await copyPresenterPrompt("en", { writeText })).toBe(true);
    expect(await copyPresenterPrompt("zh-TW", { writeText })).toBe(true);
    expect(writeText).toHaveBeenNthCalledWith(1, PRESENTER_PROMPTS.en);
    expect(writeText).toHaveBeenNthCalledWith(2, PRESENTER_PROMPTS["zh-TW"]);
  });

  it("contains clipboard failure without throwing into the presenter UI", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    await expect(copyPresenterPrompt("en", { writeText })).resolves.toBe(false);
  });
});
