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
});

