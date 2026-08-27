interface WebMCPToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: any, context: { signal: AbortSignal }) => unknown | Promise<unknown>;
}

interface ModelContext {
  registerTool(tool: WebMCPToolDefinition, options?: { signal?: AbortSignal; exposedTo?: string[] }): Promise<void>;
  getTools?(): Promise<unknown[]>;
  executeTool?(tool: unknown, input: string, options?: { signal?: AbortSignal }): Promise<unknown>;
}

interface Document { modelContext?: ModelContext; }
