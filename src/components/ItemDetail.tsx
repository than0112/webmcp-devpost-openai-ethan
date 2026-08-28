import { CalendarBlank, CheckCircle, MapPin, X } from "@phosphor-icons/react";
import type { LostItem } from "../types/item";
import { itemText, useI18n } from "../i18n";

export function ItemDetail({ item, onClose, onClaim }: { item: LostItem; onClose: () => void; onClaim: () => void }) {
  const { locale, t } = useI18n();
  const text = itemText(item, locale);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="close-button" onClick={onClose} aria-label={t("close")}><X /></button>
        <div className="detail-image"><img src={item.image} alt={text.name} /></div>
        <div className="detail-content">
          <span className="item-id">{item.id}</span><h2 id="detail-title">{text.name}</h2>
          <p className="detail-description">{text.description}</p>
          <div className="detail-facts"><span><MapPin weight="fill" /><small>{t("foundAt")}</small><strong>{text.found_location}</strong></span><span><CalendarBlank weight="fill" /><small>{t("found")}</small><strong>{item.found_date}</strong></span></div>
          <h3>{t("details")}</h3>
          <ul>{text.distinctive_features.map((feature) => <li key={feature}><CheckCircle weight="fill" />{feature}</li>)}</ul>
          <div className="status-line"><span><i /> {t("unclaimed")}</span><button className="primary-button" onClick={onClaim}>{t("mightMine")}</button></div>
        </div>
      </section>
    </div>
  );
}
