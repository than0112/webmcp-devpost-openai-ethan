import { describe, expect, it } from "vitest";
import { hasAllTokens, normalizeCategory, normalizeText, tokenize } from "./normalize";

describe("normalization", () => {
  it("normalizes punctuation and casing", () => expect(normalizeText("  Bear-Keychain! ")).toBe("bear keychain"));
  it("removes conversational stop words", () => expect(tokenize("Please find my black backpack")).toEqual(["black", "bag"]));
  it("canonicalizes common item aliases", () => expect(tokenize("white wireless AirPods")).toEqual(["white", "earbuds"]));
  it("canonicalizes category aliases", () => {
    expect(normalizeCategory("backpack")).toBe("bag");
    expect(normalizeCategory("keychain")).toBe("keys");
  });
  it("matches complete normalized tokens", () => expect(hasAllTokens("teddy bear charm", "bear charm")).toBe(true));
  it("does not use unrestricted substrings", () => expect(hasAllTokens("Waterfront", "water")).toBe(false));
  it("normalizes full-width Unicode with NFKC", () => expect(normalizeText("ＢＬＡＣＫ　ＰＥＮ")).toBe("black pen"));
  it("uses longest Traditional Chinese phrases before general aliases", () => expect(tokenize("黃色小鴨雨傘")).toEqual(["yellow", "duck", "umbrella"]));
  it("removes Traditional Chinese conversational filler", () => expect(tokenize("我昨天在體育館掉了棕色皮夾")).toEqual(["yesterday", "gym", "brown", "wallet"]));
  it("merges mixed-language aliases without duplicate tokens", () => expect([...new Set(tokenize("black 黑色 backpack 後背包"))]).toEqual(["black", "bag"]));
});
