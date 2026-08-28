import { CaretDown, Check, CircleNotch, Robot } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

export interface ActivityEntry { tool: string; message: string; state: "done" | "active"; }

export function AgentActivity({ supported, entries, onDemo, present = false }: { supported: boolean; entries: ActivityEntry[]; onDemo: () => void; present?: boolean }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(() => !present && window.matchMedia("(max-width: 680px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const handleChange = (event: MediaQueryListEvent) => setCollapsed(!present && event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [present]);
  return (
    <aside className={collapsed ? "activity-panel collapsed" : "activity-panel"} aria-label={t("agentActivity")}>
      <button className="activity-title" onClick={() => setCollapsed((value) => !value)}><span><Robot weight="fill" /> {t("agentActivity")}</span><CaretDown /></button>
      {!collapsed && <div className="activity-body">
        <div className={supported ? "support-state supported" : "support-state"}><i /> {supported ? t("toolsRegistered") : t("manualMode")}</div>
        {entries.length === 0 ? <div className="activity-empty"><p>{t("noCalls")}</p><button onClick={onDemo}>{t("runDemo")}</button></div> : <ol>{entries.map((entry, index) => <li key={`${entry.tool}-${index}`} className={entry.state}><span>{entry.state === "done" ? <Check weight="bold" /> : <CircleNotch className="spin" />}</span><div><strong>{entry.tool}</strong><small>{entry.message}</small></div></li>)}</ol>}
      </div>}
    </aside>
  );
}
