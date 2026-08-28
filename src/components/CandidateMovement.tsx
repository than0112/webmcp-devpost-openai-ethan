import { ArrowDown, ArrowUp, Equals, MinusCircle, PlusCircle } from "@phosphor-icons/react";
import type { RankDelta, RankMovement } from "../types/casefile";
import type { LostItem } from "../types/item";
import { itemText, useI18n } from "../i18n";

const icons: Record<RankMovement, typeof ArrowUp> = { up: ArrowUp, down: ArrowDown, same: Equals, entered: PlusCircle, removed: MinusCircle };
const labels = {
  en: { up: "Moved up", down: "Moved down", same: "Unchanged", entered: "Entered candidates", removed: "Removed from candidates", score: "score" },
  "zh-TW": { up: "排名上升", down: "排名下降", same: "排名不變", entered: "進入候選", removed: "移出候選", score: "分數" },
} as const;

export function CandidateMovement({ deltas, items }: { deltas: RankDelta[]; items: LostItem[] }) {
  const { locale } = useI18n();
  if (!deltas.length) return null;
  return <section className="candidate-movement" aria-label={locale === "zh-TW" ? "候選排名變化" : "Candidate movement"}>
    <h4>{locale === "zh-TW" ? "候選排名變化" : "Candidate movement"}</h4>
    <ul>{deltas.map((delta) => {
      const Icon = icons[delta.movement];
      const item = items.find((candidate) => candidate.id === delta.item_id);
      const name = item ? itemText(item, locale).name : delta.item_id;
      const sign = delta.score_delta > 0 ? "+" : "";
      return <li key={delta.item_id} className={`movement-${delta.movement}`}>
        <Icon weight="bold" /><span><strong>{name}</strong><small>{labels[locale][delta.movement]} · {labels[locale].score} {sign}{Math.round(delta.score_delta * 100)}%</small></span>
        {delta.changed_evidence.length > 0 && <em>{delta.changed_evidence.slice(0, 2).map((entry) => `${entry.change}: ${entry.clue}`).join(" · ")}</em>}
      </li>;
    })}</ul>
  </section>;
}
