import { describe, expect, it, vi } from "vitest";
import evals from "../data/v3-evals.json";
import itemsData from "../data/items.json";
import type { Casefile } from "../types/casefile";
import type { LostItem } from "../types/item";
import type { InvestigationSession } from "../types/investigation";
import { applyMutationToCasefile } from "./clue-mutations";
import { loadActiveCase, saveActiveCase } from "./persistence";
import { rankItems } from "./search";
import { createWebMCPTools } from "./webmcp-tools";

const items = itemsData as LostItem[];

describe("V3 evaluation pack", () => {
  for (const group of ["localized_catalog", "english", "mixed_language"] as const) {
    it(`passes every ${group} Top-1 fixture`, () => {
      for (const fixture of evals[group]) expect(rankItems(items, { query: fixture.query })[0].item.id, fixture.query).toBe(fixture.expected_top1);
    });
  }

  it("covers all 30 localized catalog items exactly once", () => {
    expect(evals.localized_catalog.map((fixture) => fixture.expected_top1).sort()).toEqual(items.map((item) => item.id).sort());
  });

  it("persists a corrected case and preserves its deterministic score snapshot", () => {
    const base: Casefile = { version: 1, id: "eval-case", locale: "zh-TW", originalDescription: "棕色皮夾", clues: [{ kind: "query", value: "棕色皮夾", source: "query" }], candidateIds: ["LF-013", "LF-014"], steps: [], scoreSnapshots: [], status: "searching", createdAt: 1, updatedAt: 1 };
    const corrected = applyMutationToCasefile(base, { action: "add", clue: { kind: "feature", value: "按扣", source: "human" } }, items, 2).casefile;
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => { storage.set(key, value); }, removeItem: (key: string) => { storage.delete(key); } };
    expect(saveActiveCase(adapter, corrected).ok).toBe(true);
    const restored = loadActiveCase(adapter, new Set(items.map((item) => item.id)));
    expect(restored.status).toBe("restored");
    if (restored.status === "restored") {
      expect(restored.casefile.id).toBe("eval-case");
      expect(restored.casefile.bestMatch).toBe("LF-013");
      expect(restored.casefile.scoreSnapshots.at(-1)?.scores["LF-013"]).toBeGreaterThan(0);
    }
  });

  it("covers stale IDs, cancellation, and the human-only claim boundary", async () => {
    let session: InvestigationSession | null = null;
    const callbacks = { onActivity: vi.fn(), onSearch: vi.fn(), onHighlight: vi.fn(), onClaim: vi.fn(), onInvestigation: vi.fn(), onEvidence: vi.fn() };
    const tools = createWebMCPTools(items, callbacks, { get: () => session, set: (next) => { session = next; } }, { createId: () => "eval-case", now: () => 1 });
    const tool = (name: string) => tools.find((candidate) => candidate.name === name)!;
    expect((await tool("get_active_case").execute({ case_id: "stale" }) as any).error.code).toBe("invalid_case");
    const controller = new AbortController(); controller.abort();
    expect(() => tool("search_lost_items").execute({ query: "wallet" }, { signal: controller.signal })).toThrow();
    const claim = await tool("request_claim").execute({ item_id: "LF-013" }) as any;
    expect(claim.status).toBe("confirmation_required");
    expect(claim.message).toContain("No claim has been submitted");
    expect(tools.some((candidate) => candidate.name === "confirm_claim")).toBe(false);
  });

  it("declares every required workflow dimension", () => {
    expect(evals.workflow_requirements).toEqual(expect.arrayContaining(["persistence", "clue_correction", "score_delta", "stale_case_id", "cancellation", "human_only_claim"]));
  });
});
