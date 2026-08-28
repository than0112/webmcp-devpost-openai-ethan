import { ArrowRight, MapPin } from "@phosphor-icons/react";
import type { LostItem } from "../types/item";
import { itemText, useI18n } from "../i18n";

export function ItemCard({ item, highlighted, candidateState, onOpen }: { item: LostItem; highlighted: boolean; candidateState?: "candidate" | "dimmed" | "best"; onOpen: () => void }) {
  const { locale, t } = useI18n();
  const text = itemText(item, locale);
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const classes = ["item-card", highlighted ? "highlighted" : "", candidateState ? `candidate-${candidateState}` : ""].filter(Boolean).join(" ");
  return (
    <article id={item.id} className={classes}>
      <button className="card-hit-area" onClick={onOpen} aria-label={`${t("viewItem")} ${text.name}`}>
        <span className="item-id">{item.id}</span>
        <div className="item-image"><img src={item.image} alt="" /></div>
        <div className="item-copy">
          <h3>{text.name}</h3>
          <p><MapPin weight="fill" /> {text.found_location}</p>
          <div><time>{date.format(new Date(`${item.found_date}T00:00:00Z`))}</time><span>{t("viewItem")} <ArrowRight weight="bold" /></span></div>
        </div>
      </button>
    </article>
  );
}
