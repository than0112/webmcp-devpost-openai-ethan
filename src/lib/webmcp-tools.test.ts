import { describe, expect, it, vi } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import type { InvestigationSession } from "../types/investigation";
import type { Casefile } from "../types/casefile";
import { createWebMCPTools } from "./webmcp-tools";

const items = itemsData as LostItem[];

function harness(restored?: { session: InvestigationSession; casefile: Casefile }) {
  let session: InvestigationSession | null = restored?.session ?? null;
  const callbacks = { onActivity: vi.fn(), onSearch: vi.fn(), onHighlight: vi.fn(), onClaim: vi.fn(), onInvestigation: vi.fn(), onEvidence: vi.fn(), getActiveInvestigation: () => restored?.session ?? null, getActiveCase: () => restored?.casefile ?? null };
  const tools = createWebMCPTools(items, callbacks, { get: () => session, set: (next) => { session = next; } }, { createId: () => "session-1", now: () => 100 });
  return { tools, callbacks, session: () => session, tool: (name: string) => tools.find((candidate) => candidate.name === name)! };
}

describe("V3 WebMCP tools", () => {
  it("registers exactly the seven approved tools and no confirmation tool", () => expect(harness().tools.map((tool) => tool.name)).toEqual([
    "search_lost_items", "get_item_details", "get_search_facets", "compare_items", "get_match_evidence", "request_claim", "get_active_case",
  ]));

  it("creates an investigation from a generic search", async () => {
    const h = harness();
    const output = await h.tool("search_lost_items").execute({ query: "keys", limit: 5 }) as any;
    expect(output.case_id).toBe("session-1");
    expect(output.session_id).toBe("session-1");
    expect(output.results.map((result: any) => result.item_id)).toEqual(expect.arrayContaining(["LF-015", "LF-016", "LF-017", "LF-018"]));
    expect(h.session()?.searches).toHaveLength(1);
  });

  it("returns a structured validation error for an empty query", async () => {
    const output = await harness().tool("search_lost_items").execute({ query: "  " }) as any;
    expect(output.error.code).toBe("validation_error");
  });

  it("defaults to Top-5 and honors an explicit smaller limit", async () => {
    const defaultOutput = await harness().tool("search_lost_items").execute({ query: "black" }) as any;
    const explicitOutput = await harness().tool("search_lost_items").execute({ query: "black", limit: 2 }) as any;
    expect(defaultOutput.results).toHaveLength(5);
    expect(explicitOutput.results).toHaveLength(2);
  });

  it("continues the same session with a new clue", async () => {
    const h = harness();
    await h.tool("search_lost_items").execute({ query: "keys" });
    const output = await h.tool("search_lost_items").execute({ session_id: "session-1", query: "bear", features: ["bear"] }) as any;
    expect(output.results[0].item_id).toBe("LF-017");
    expect(output.candidate_count).toBeLessThanOrEqual(3);
    expect(h.session()?.searches).toHaveLength(2);
  });

  it("rejects stale session IDs without hidden state", async () => {
    const h = harness();
    const output = await h.tool("get_search_facets").execute({ session_id: "stale" }) as any;
    expect(output.error.code).toBe("invalid_case");
    expect(h.session()).toBeNull();
  });

  it("derives facets only from active session candidates", async () => {
    const h = harness();
    await h.tool("search_lost_items").execute({ query: "keys" });
    const output = await h.tool("get_search_facets").execute({ session_id: "session-1" }) as any;
    expect(output.status).toBe("needs_clue");
    expect(output.useful_clues.length).toBeGreaterThan(0);
  });

  it("compares candidates with contradiction evidence", async () => {
    const h = harness();
    const output = await h.tool("compare_items").execute({ item_ids: ["LF-007", "LF-008"], known_clues: { category: "bag", colors: ["black"] } }) as any;
    expect(output.best_match.item_id).toBe("LF-007");
    expect(output.alternatives[0].contradictions).toContain("black");
  });

  it("returns the exact evidence breakdown and updates visible evidence", async () => {
    const h = harness();
    const output = await h.tool("get_match_evidence").execute({ item_id: "LF-017", known_clues: { category: "keys", features: ["bear"] } }) as any;
    expect(output.summary).toEqual({ strength: "strong", score: 1 });
    expect(output.score_breakdown).toEqual(expect.arrayContaining([expect.objectContaining({ clue: "bear", points: 25 })]));
    expect(h.callbacks.onEvidence).toHaveBeenCalledOnce();
  });

  it("keeps claim completion behind human confirmation", async () => {
    const h = harness();
    const output = await h.tool("request_claim").execute({ item_id: "LF-017" }) as any;
    expect(output.status).toBe("confirmation_required");
    expect(h.callbacks.onClaim).toHaveBeenCalledOnce();
    expect(output.message).toContain("No claim has been submitted");
  });

  it("uses case_id and keeps the V2 session_id alias as an internal migration path", async () => {
    const h = harness();
    await h.tool("search_lost_items").execute({ query: "wallet" });
    const current = await h.tool("search_lost_items").execute({ case_id: "session-1", query: "brown" }) as any;
    const migrated = await h.tool("get_search_facets").execute({ session_id: "session-1" }) as any;
    expect(current.case_id).toBe("session-1");
    expect(migrated.case_id).toBe("session-1");
  });

  it("returns localized item metadata and deterministic Traditional Chinese facet prompts", async () => {
    const h = harness();
    const details = await h.tool("get_item_details").execute({ item_id: "LF-013", locale: "zh-TW" }) as any;
    await h.tool("search_lost_items").execute({ query: "keys", locale: "zh-TW" });
    const facets = await h.tool("get_search_facets").execute({ case_id: "session-1", locale: "zh-TW" }) as any;
    expect(details.name).toBe("棕色皮夾");
    expect(facets.useful_clues[0].question_hint).toMatch(/[\u3400-\u9fff]/u);
  });

  it("returns the restored visible case and rejects a stale requested ID", async () => {
    const session: InvestigationSession = { id: "restored-1", originalQuery: "棕色皮夾", clues: [{ kind: "query", value: "棕色皮夾", source: "query" }], candidateIds: ["LF-013"], searches: [], bestMatch: "LF-013", status: "possible_match" };
    const casefile: Casefile = { version: 1, id: session.id, locale: "zh-TW", originalDescription: session.originalQuery, clues: session.clues, candidateIds: session.candidateIds, bestMatch: session.bestMatch, steps: [], scoreSnapshots: [], status: session.status, createdAt: 1, updatedAt: 2 };
    const h = harness({ session, casefile });
    const active = await h.tool("get_active_case").execute({}) as any;
    const stale = await h.tool("get_active_case").execute({ case_id: "wrong" }) as any;
    expect(active).toMatchObject({ case_id: "restored-1", locale: "zh-TW", best_match: "LF-013" });
    expect(stale.error.code).toBe("invalid_case");
  });

  it("uses object schemas, explicit trust annotations, and correct read-only hints", () => {
    const tools = harness().tools;
    for (const tool of tools) {
      expect(tool.inputSchema).toMatchObject({ type: "object", additionalProperties: false });
      expect(tool.annotations.untrustedContentHint).toBe(true);
    }
    expect(tools.find((tool) => tool.name === "search_lost_items")?.annotations.readOnlyHint).toBe(false);
    expect(tools.find((tool) => tool.name === "get_search_facets")?.annotations.readOnlyHint).toBe(true);
    expect(tools.find((tool) => tool.name === "get_active_case")?.annotations.readOnlyHint).toBe(true);
  });

  it("checks cancellation before committing state or visible callbacks", async () => {
    const h = harness();
    const controller = new AbortController();
    controller.abort();
    expect(() => h.tool("search_lost_items").execute({ query: "wallet" }, { signal: controller.signal })).toThrow();
    expect(h.session()).toBeNull();
    expect(h.callbacks.onSearch).not.toHaveBeenCalled();
    expect(h.callbacks.onActivity).not.toHaveBeenCalled();
  });

  it("rejects conflicting case aliases without changing the active case", async () => {
    const h = harness();
    await h.tool("search_lost_items").execute({ query: "keys" });
    const before = h.session();
    const output = await h.tool("search_lost_items").execute({ case_id: "session-1", session_id: "other", query: "bear" }) as any;
    expect(output.error.code).toBe("conflicting_case_id");
    expect(h.session()).toBe(before);
  });
});
