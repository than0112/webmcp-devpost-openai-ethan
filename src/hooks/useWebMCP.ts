import { useEffect, useState } from "react";
import type { LostItem, SearchInput, UserDescription } from "../types/item";
import type { ActivityEntry } from "../components/AgentActivity";
import { searchItems } from "../lib/search";
import { compareItems } from "../lib/matching";

interface Callbacks {
  onActivity: (entry: ActivityEntry) => void;
  onHighlight: (id: string) => void;
  onClaim: (item: LostItem, description?: UserDescription) => void;
}

export function useWebMCP(items: LostItem[], callbacks: Callbacks) {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) { setSupported(false); return; }
    const controller = new AbortController();
    const register = async () => {
      const common = { type: "object", additionalProperties: false };
      await modelContext.registerTool({
        name: "search_lost_items", title: "Search lost items",
        description: "Search reported lost-and-found items using known attributes. Use before requesting details or a claim.",
        inputSchema: { ...common, properties: { query: { type: "string", description: "Words the user remembers" }, category: { type: "string" }, color: { type: "string" }, location: { type: "string" }, date: { type: "string", description: "A date or relative value such as yesterday" } } },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async (input: SearchInput, context) => { context?.signal?.throwIfAborted(); const results = searchItems(items, input); callbacks.onActivity({ tool: "search_lost_items", message: `Found ${results.length} item${results.length === 1 ? "" : "s"}`, state: "done" }); return { count: results.length, results: results.map(({ id, name, image, found_location, found_date }) => ({ id, name, image, found_location, found_date })) }; },
      }, { signal: controller.signal });
      await modelContext.registerTool({
        name: "get_item_details", title: "Get item details",
        description: "Retrieve full structured details for one reported item and bring that item into view.",
        inputSchema: { ...common, properties: { item_id: { type: "string", pattern: "^LF-[0-9]{3}$", description: "Catalog ID such as LF-003" } }, required: ["item_id"] },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async ({ item_id }: { item_id: string }, context) => { context?.signal?.throwIfAborted(); const item = items.find((candidate) => candidate.id === item_id); if (!item) return { error: "Item not found." }; callbacks.onHighlight(item.id); callbacks.onActivity({ tool: "get_item_details", message: `Inspecting ${item.id}`, state: "done" }); return item; },
      }, { signal: controller.signal });
      await modelContext.registerTool({
        name: "compare_items", title: "Compare lost items",
        description: "Compare candidate items against remembered clues using deterministic weighted matching.",
        inputSchema: { ...common, properties: { item_ids: { type: "array", items: { type: "string", pattern: "^LF-[0-9]{3}$" }, minItems: 1 }, user_description: { type: "object", properties: { category: { type: "string" }, color: { type: "string" }, location: { type: "string" }, date: { type: "string" }, features: { type: "array", items: { type: "string" } } } } }, required: ["item_ids", "user_description"] },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: async ({ item_ids, user_description }: { item_ids: string[]; user_description: UserDescription }, context) => { context?.signal?.throwIfAborted(); const candidates = items.filter((item) => item_ids.includes(item.id)); const [best, ...alternatives] = compareItems(candidates, user_description); if (!best) return { error: "No valid candidate items." }; callbacks.onHighlight(best.item.id); callbacks.onActivity({ tool: "compare_items", message: `${Math.round(best.score * 100)}% match · ${best.item.id}`, state: "done" }); const shape = (result: typeof best) => ({ item_id: result.item.id, name: result.item.name, image: result.item.image, score: result.score, matched_features: result.matched_features, missing_features: result.missing_features }); return { best_match: shape(best), alternatives: alternatives.map(shape) }; },
      }, { signal: controller.signal });
      await modelContext.registerTool({
        name: "request_claim", title: "Request claim confirmation",
        description: "Start the human confirmation step for a possible matching item. The user must confirm in the page UI.",
        inputSchema: { ...common, properties: { item_id: { type: "string", pattern: "^LF-[0-9]{3}$" } }, required: ["item_id"] },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async ({ item_id }: { item_id: string }, context) => { context?.signal?.throwIfAborted(); const item = items.find((candidate) => candidate.id === item_id); if (!item) return { error: "Item not found." }; callbacks.onClaim(item); callbacks.onActivity({ tool: "request_claim", message: "Waiting for human", state: "active" }); return { status: "confirmation_required", item_id, message: "Human confirmation is required to claim this item." }; },
      }, { signal: controller.signal });
      setSupported(true);
    };
    register().catch(() => setSupported(false));
    return () => controller.abort();
  }, [callbacks, items]);
  return supported;
}
