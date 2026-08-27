import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import { buildKeysInvestigation } from "./demo";

const items = itemsData as LostItem[];

describe("official keys investigation demo", () => {
  it("starts from all four real key candidates", () => {
    const result = buildKeysInvestigation(items, { id: "demo", startTime: 1 })!;
    expect(result.session.searches[0].candidateIds).toEqual(["LF-015", "LF-016", "LF-017", "LF-018"]);
  });
  it("uses an actual high-value facet", () => expect(buildKeysInvestigation(items, { id: "demo", startTime: 1 })!.facets[0]).toMatchObject({ field: "distinctive_features", information_gain: "high" }));
  it("refines the same session to the generic best match", () => {
    const result = buildKeysInvestigation(items, { id: "demo", startTime: 1 })!;
    expect(result.session.id).toBe("demo");
    expect(result.evidence.item.id).toBe("LF-017");
    expect(result.session.candidateIds.length).toBeLessThanOrEqual(3);
  });
  it("derives bear evidence without invented fields", () => {
    const evidence = buildKeysInvestigation(items, { id: "demo", startTime: 1 })!.evidence;
    expect(evidence.matched).toEqual(expect.arrayContaining(["key", "bear charm"]));
    expect(evidence.unknown).toEqual([]);
    expect(evidence.contradictions).toEqual([]);
  });
  it("builds five result-backed timeline steps and stops for a human", () => {
    const session = buildKeysInvestigation(items, { id: "demo", startTime: 1 })!.session;
    expect(session.searches).toHaveLength(5);
    expect(session.status).toBe("confirmation_required");
  });
  it("is deterministic for the same dataset", () => {
    const first = buildKeysInvestigation(items, { id: "demo", startTime: 1 });
    const second = buildKeysInvestigation(items, { id: "demo", startTime: 1 });
    expect(second).toEqual(first);
  });
});
