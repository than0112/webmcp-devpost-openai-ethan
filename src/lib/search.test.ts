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
    ["red heart keychain", "LF-018"],
    ["airpods", "LF-019"],
    ["black cap", "LF-025"],
    ["black gloves", "LF-028"],
    ["yellow notebook", "LF-029"],
  ])("ranks '%s' as %s without an ID-specific branch", (query, expectedId) => {
    expect(rankItems(items, { query })[0]?.item.id).toBe(expectedId);
  });

  it("can retrieve every catalog item generically by its natural-language name", () => {
    for (const item of items) {
      expect(rankItems(items, { query: item.name })[0]?.item.id).toBe(item.id);
    }
  });

  it.each([
    ["黃色小鴨雨傘", "LF-003"],
    ["黑色後背包", "LF-007"],
    ["綠色後背包", "LF-008"],
    ["棕色皮夾", "LF-013"],
    ["房屋鑰匙", "LF-015"],
    ["小熊鑰匙圈", "LF-017"],
    ["白色無線耳機", "LF-019"],
    ["耳罩式耳機", "LF-020"],
    ["圓框眼鏡", "LF-021"],
    ["黑框眼鏡", "LF-022"],
    ["藍色水壺", "LF-023"],
    ["黑色棒球帽", "LF-025"],
    ["灰色圍巾", "LF-027"],
    ["黑色手套", "LF-028"],
    ["黑色原子筆", "LF-030"],
  ])("ranks the Traditional Chinese query '%s' as %s", (query, expectedId) => {
    expect(rankItems(items, { query })[0]?.item.id).toBe(expectedId);
  });

  it.each([
    ["yellow 小鴨 umbrella", "LF-003"],
    ["black 後背包", "LF-007"],
    ["green 後背包 with 扣帶", "LF-008"],
    ["brown 皮夾 at 體育館", "LF-013"],
    ["house 鑰匙", "LF-015"],
    ["bear 鑰匙圈", "LF-017"],
    ["white 無線耳機", "LF-019"],
    ["round 眼鏡", "LF-021"],
    ["blue 水壺 at gym", "LF-023"],
    ["black 原子筆", "LF-030"],
  ])("ranks the mixed-language query '%s' as %s", (query, expectedId) => {
    expect(rankItems(items, { query })[0]?.item.id).toBe(expectedId);
  });

  it("discovers all 30 localized names through the same generic index", () => {
    for (const item of items) {
      expect(item.localized?.["zh-TW"].name).toBeTruthy();
      expect(rankItems(items, { query: item.localized!["zh-TW"].name })[0]?.item.id).toBe(item.id);
    }
  });

  it("parses a natural Traditional Chinese wallet description without item-specific logic", () => {
    expect(rankItems(items, { query: "我昨天在體育館掉了棕色皮夾" })[0]?.item.id).toBe("LF-013");
  });

  it("returns multiple ranked candidates when clues point to different items", () => {
    const ids = rankItems(items, { query: "black backpack with a bear keychain" }).slice(0, 2).map((result) => result.item.id);
    expect(ids).toEqual(["LF-017", "LF-007"]);
  });

  it("resolves demo-relative dates deterministically", () => {
    expect(resolveDate("yesterday")).toBe("2026-08-26");
    expect(resolveDate("昨天")).toBe("2026-08-26");
  });

  it("supports structured location and feature clues", () => {
    expect(rankItems(items, { location: "Children's Library", features: ["bear charm"] })[0]?.item.id).toBe("LF-017");
  });

  it("does not let partial words create location matches", () => {
    expect(rankItems(items, { query: "water" }).some((result) => result.item.found_area === "Waterfront")).toBe(false);
  });
});
