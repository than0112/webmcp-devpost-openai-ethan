import { CalendarBlank, CheckCircle, MapPin, X } from "@phosphor-icons/react";
import type { LostItem } from "../types/item";

export function ItemDetail({ item, onClose, onClaim }: { item: LostItem; onClose: () => void; onClaim: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="close-button" onClick={onClose} aria-label="Close"><X /></button>
        <div className="detail-image"><img src={item.image} alt={item.name} /></div>
        <div className="detail-content">
          <span className="item-id">{item.id}</span><h2 id="detail-title">{item.name}</h2>
          <p className="detail-description">{item.description}</p>
          <div className="detail-facts"><span><MapPin weight="fill" /><small>Found at</small><strong>{item.found_location}</strong></span><span><CalendarBlank weight="fill" /><small>Found</small><strong>{item.found_date}</strong></span></div>
          <h3>Identifying details</h3>
          <ul>{item.distinctive_features.map((feature) => <li key={feature}><CheckCircle weight="fill" />{feature}</li>)}</ul>
          <div className="status-line"><span><i /> Unclaimed</span><button className="primary-button" onClick={onClaim}>This might be mine</button></div>
        </div>
      </section>
    </div>
  );
}
