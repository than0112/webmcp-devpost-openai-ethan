import { useCallback, useEffect, useRef, useState } from "react";
import type { LostItem } from "../types/item";
import type { InvestigationSession } from "../types/investigation";
import { createWebMCPTools, type WebMCPCallbacks } from "../lib/webmcp-tools";

export function useWebMCP(items: LostItem[], callbacks: WebMCPCallbacks) {
  const [supported, setSupported] = useState(false);
  const sessionRef = useRef<InvestigationSession | null>(null);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext) { setSupported(false); return; }
    const controller = new AbortController();
    const tools = createWebMCPTools(items, callbacks, {
      get: () => sessionRef.current,
      set: (session) => { sessionRef.current = session; },
    });
    Promise.all(tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })))
      .then(() => setSupported(true))
      .catch(() => setSupported(false));
    return () => controller.abort();
  }, [callbacks, items]);

  const reset = useCallback(() => {
    sessionRef.current = null;
    callbacks.onInvestigation?.(null);
  }, [callbacks]);

  return { supported, reset };
}
