import { CaretDown, Check, CircleNotch, Robot } from "@phosphor-icons/react";
import { useState } from "react";

export interface ActivityEntry { tool: string; message: string; state: "done" | "active"; }

export function AgentActivity({ supported, entries, onDemo }: { supported: boolean; entries: ActivityEntry[]; onDemo: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={collapsed ? "activity-panel collapsed" : "activity-panel"} aria-label="Agent activity">
      <button className="activity-title" onClick={() => setCollapsed((value) => !value)}><span><Robot weight="fill" /> Agent Activity</span><CaretDown /></button>
      {!collapsed && <div className="activity-body">
        <div className={supported ? "support-state supported" : "support-state"}><i /> {supported ? "WebMCP tools registered" : "Manual browsing mode"}</div>
        {entries.length === 0 ? <div className="activity-empty"><p>No agent calls yet.</p><button onClick={onDemo}>Run current search as demo</button></div> : <ol>{entries.map((entry, index) => <li key={`${entry.tool}-${index}`} className={entry.state}><span>{entry.state === "done" ? <Check weight="bold" /> : <CircleNotch className="spin" />}</span><div><strong>{entry.tool}</strong><small>{entry.message}</small></div></li>)}</ol>}
      </div>}
    </aside>
  );
}
