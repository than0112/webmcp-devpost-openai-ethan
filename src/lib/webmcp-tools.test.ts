import { describe, expect, it, vi } from "vitest";
import itemsData from "../data/items.json";
import type { LostItem } from "../types/item";
import type { InvestigationSession } from "../types/investigation";
import { createWebMCPTools } from "./webmcp-tools";

const items = itemsData as LostItem[];

function harness() {
  let session: InvestigationSession | null = null;
  const callbacks = { onActivity: vi.fn(), onSearch: vi.fn(), onHighlight: vi.fn(), onClaim: vi.fn(), onInvestigation: vi.fn(), onEvidence: vi.fn() };
  const tools = createWebMCPTools(items, callbacks, { get: () => session, set: (next) => { session = next; } }, { createId: () => "session-1", now: () => 100 });
  return { tools, callbacks, session: () => session, tool: (name: string) => tools.find((candidate) => candidate.name === name)! };
}

describe("V2 WebMCP tools", () => {
  it("registers exactly the six approved tools", () => expect(harness().tools.map((tool) => tool.name)).toEqual([
    "search_lost_items", "get_item_details", "get_search_facets", "compare_items", "get_match_evidence", "request_claim",
  ]));

  it("creates an investigation from a generic search", async () => {
    const h = harness();
    const output = await h.tool("search_lost_items").execute({ query: "keys", limit: 5 }) as any;
    expect(output.session_id).toBe("session-1");
    expect(output.results.map((result: any) => result.item_id)).toEqual(expect.arrayContaining(["LF-015", "LF-016", "LF-017", "LF-018"]));
    expect(h.session()?.searches).toHaveLength(1);
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
    expect(output.error.code).toBe("invalid_session");
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
  });
});
