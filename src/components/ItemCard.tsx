import { ArrowRight, MapPin } from "@phosphor-icons/react";
import type { LostItem } from "../types/item";

const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });

export function ItemCard({ item, highlighted, onOpen }: { item: LostItem; highlighted: boolean; onOpen: () => void }) {
  return (
    <article id={item.id} className={highlighted ? "item-card highlighted" : "item-card"}>
      <button className="card-hit-area" onClick={onOpen} aria-label={`View ${item.name}`}>
        <span className="item-id">{item.id}</span>
        <div className="item-image"><img src={item.image} alt="" /></div>
        <div className="item-copy">
          <h3>{item.name}</h3>
          <p><MapPin weight="fill" /> {item.found_location}</p>
          <div><time>{date.format(new Date(`${item.found_date}T00:00:00Z`))}</time><span>View item <ArrowRight weight="bold" /></span></div>
        </div>
      </button>
    </article>
  );
}
