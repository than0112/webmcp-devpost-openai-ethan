import { Check, CheckCircle, ShieldCheck, X } from "@phosphor-icons/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { LostItem, MatchResult } from "../types/item";

export function ClaimModal({ item, match, confirmed, onCancel, onConfirm }: { item: LostItem; match?: MatchResult; confirmed: boolean; onCancel: () => void; onConfirm: () => void }) {
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
        <button className="close-button" onClick={onCancel} aria-label="Close"><X /></button>
        <span className="section-kicker"><ShieldCheck weight="fill" /> Human confirmation required</span>
        <h2 id="claim-title">Possible match found</h2>
        <div className="claim-item"><img src={item.image} alt="" /><div><span className="item-id">{item.id}</span><h3>{item.name}</h3><p>{item.found_location} · {item.found_date}</p></div><strong>{score}%<small>match</small></strong></div>
        <h4>Matched clues</h4><ul>{clues.map((clue) => <li key={clue}><Check weight="bold" />{clue}</li>)}</ul>
        <p className="human-rule"><ShieldCheck weight="fill" /><span><strong>The agent stopped here.</strong><br />Only you can confirm this claim.</span></p>
        <div className="claim-actions"><button onClick={onCancel}>Cancel</button><button className="primary-button" onClick={onConfirm}><Check weight="bold" /> Confirm claim</button></div>
        </div>
        <div className="claim-success-state" hidden={!confirmed}>
          <CheckCircle weight="fill" />
          <span className="section-kicker">Human confirmed</span>
          <h2 id="claim-success-title">Claim request created</h2>
          <p>Your confirmation has been recorded for this demo. No external request was sent.</p>
          <button className="primary-button" onClick={onCancel}>Back to found items</button>
        </div>
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
