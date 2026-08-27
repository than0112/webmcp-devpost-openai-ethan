import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { getSearchFacets } from "./facets";

const items = itemsData as LostItem[];
const keys = items.filter((item) => item.category === "keys");

describe("getSearchFacets", () => {
  it("returns no facet for zero candidates", () => expect(getSearchFacets([])).toEqual([]));
  it("returns no facet for one candidate", () => expect(getSearchFacets([keys[0]])).toEqual([]));
  it("returns at most three facets", () => expect(getSearchFacets(keys)).toHaveLength(3));
  it("prioritizes canonical distinctive details for key candidates", () => expect(getSearchFacets(keys)[0].field).toBe("distinctive_features"));
  it("classifies a fully discriminating facet as high gain", () => expect(getSearchFacets(keys)[0].information_gain).toBe("high"));
  it("excludes a field already known by the session", () => {
    expect(getSearchFacets(keys, [{ kind: "feature", value: "bear", source: "human" }]).some((facet) => facet.field === "distinctive_features")).toBe(false);
  });
  it("does not return a shared category with zero discrimination", () => expect(getSearchFacets(keys).some((facet) => facet.field === "category")).toBe(false));
  it("is deterministic", () => expect(getSearchFacets(keys)).toEqual(getSearchFacets(keys)));
});

