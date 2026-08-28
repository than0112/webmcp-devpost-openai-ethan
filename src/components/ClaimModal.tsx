import { Check, CheckCircle, ShieldCheck, X } from "@phosphor-icons/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { LostItem, MatchResult } from "../types/item";
import { itemText, useI18n } from "../i18n";

export function ClaimModal({ item, match, confirmed, onCancel, onConfirm }: { item: LostItem; match?: MatchResult; confirmed: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { locale, t } = useI18n();
  const text = itemText(item, locale);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const clues = match?.matched_features ?? item.distinctive_features;
  const score = Math.round((match?.score ?? .96) * 100);
  const content = (
    <div className="modal-backdrop" role="presentation" translate="no" onMouseDown={(event) => !confirmed && event.target === event.currentTarget && onCancel()}>
      <section className={confirmed ? "claim-modal success" : "claim-modal"} role="dialog" aria-modal="true" aria-labelledby={confirmed ? "claim-success-title" : "claim-title"}>
        <div className="claim-confirmation-state" hidden={confirmed}>
        <button className="close-button" onClick={onCancel} aria-label={t("close")}><X /></button>
        <span className="section-kicker"><ShieldCheck weight="fill" /> {t("confirmationRequired")}</span>
        <h2 id="claim-title">{t("possibleFound")}</h2>
        <div className="claim-item"><img src={item.image} alt="" /><div><span className="item-id">{item.id}</span><h3>{text.name}</h3><p>{text.found_location} · {item.found_date}</p></div><strong>{score}%<small>{t("match")}</small></strong></div>
        <h4>{t("matchedClues")}</h4><ul>{clues.map((clue) => <li key={clue}><Check weight="bold" />{clue}</li>)}</ul>
        <p className="human-rule"><ShieldCheck weight="fill" /><span><strong>{t("agentStopped")}</strong><br />{t("onlyConfirm")}</span></p>
        <div className="claim-actions"><button onClick={onCancel}>{t("cancel")}</button><button className="primary-button" onClick={onConfirm}><Check weight="bold" /> {t("confirmClaim")}</button></div>
        </div>
        <div className="claim-success-state" hidden={!confirmed}>
          <CheckCircle weight="fill" />
          <span className="section-kicker">{t("humanConfirmed")}</span>
          <h2 id="claim-success-title">{t("claimCreated")}</h2>
          <p>{t("demoRecorded")}</p>
          <button className="primary-button" onClick={onCancel}>{t("backItems")}</button>
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
