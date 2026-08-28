import { ArrowSquareOut, CheckCircle, Circle, MagnifyingGlass, Question, ShieldWarning, Sparkle, X } from "@phosphor-icons/react";
import type { MatchResult } from "../types/item";
import type { InvestigationSession, SearchFacet } from "../types/investigation";
import { itemText, useI18n } from "../i18n";

function EvidenceList({ title, values, tone }: { title: string; values: string[]; tone: "matched" | "unknown" | "contradiction" }) {
  const { t } = useI18n();
  const Icon = tone === "matched" ? CheckCircle : tone === "unknown" ? Question : ShieldWarning;
  return <div className={`evidence-group ${tone}`}><h4><Icon weight="fill" />{title}</h4>{values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>{t("noneRecorded")}</p>}</div>;
}

export function InvestigationPanel({ session, facets, evidence, onReset, onReview }: {
  session: InvestigationSession;
  facets: SearchFacet[];
  evidence?: MatchResult;
  onReset: () => void;
  onReview: (itemId: string) => void;
}) {
  const { locale, t } = useI18n();
  const statusLabels = { searching: t("searching"), needs_clue: t("needsClue"), possible_match: t("possibleMatch"), confirmation_required: t("waitingYou"), completed: t("completed") };
  const evidenceText = evidence ? itemText(evidence.item, locale) : null;
  return (
    <aside className="investigation-panel" aria-label={t("liveInvestigation")}>
      <div className="investigation-header">
        <div><span className="panel-kicker"><Sparkle weight="fill" /> {t("liveInvestigation")}</span><h3>{statusLabels[session.status]}</h3></div>
        <button onClick={onReset} aria-label={t("resetInvestigation")}><X /></button>
      </div>
      <div className="candidate-summary"><strong>{session.candidateIds.length}</strong><span>{session.candidateIds.length === 1 ? t("currentCandidate") : t("currentCandidates")}</span><small>{session.originalQuery}</small></div>
      <section className="timeline-section"><h4>{t("timeline")}</h4><ol>{session.searches.map((step, index) => <li key={`${step.id}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><small>{step.candidateCount} {step.candidateCount === 1 ? t("matchOne") : t("matches")}</small></div></li>)}</ol></section>
      {facets[0] && <section className="next-clue"><span><MagnifyingGlass weight="bold" /> {t("suggested")}</span><strong>{facets[0].question_hint}</strong><div>{facets[0].example_values.slice(0, 3).map((value) => <i key={value}>{value}</i>)}</div></section>}
      {evidence && <section className="evidence-card">
        <div className="evidence-heading"><div><span>{evidence.item.id}</span><h4>{evidenceText?.name}</h4></div><strong className={`strength ${evidence.match_strength}`}>{evidence.match_strength} {t("match")}</strong></div>
        <div className="match-score"><strong>{Math.round(evidence.score * 100)}%</strong><span>{t("matchScore")}</span></div>
        <EvidenceList title={t("matched")} values={evidence.matched} tone="matched" />
        <EvidenceList title={t("unknown")} values={evidence.unknown} tone="unknown" />
        <EvidenceList title={t("contradictions")} values={evidence.contradictions} tone="contradiction" />
        <button className="review-match" onClick={() => onReview(evidence.item.id)}>{t("reviewMatch")} <ArrowSquareOut weight="bold" /></button>
      </section>}
      {!evidence && <div className="evidence-placeholder"><Circle weight="fill" /><p>{t("comparePrompt")}</p></div>}
      <button className="reset-investigation" onClick={onReset}>{t("resetInvestigation")}</button>
    </aside>
  );
}

export function InvestigationStandby({ onRun }: { onRun: () => void }) {
  const { t } = useI18n();
  return <aside className="investigation-panel standby" aria-label={t("readyInvestigate")}>
    <div className="investigation-header"><div><span className="panel-kicker"><Sparkle weight="fill" /> {t("stableDemo")}</span><h3>{t("readyInvestigate")}</h3></div></div>
    <div className="standby-copy"><MagnifyingGlass weight="duotone" /><h4>{t("allSearchable")}</h4><p>{t("stableCopy")}</p><button className="review-match" onClick={onRun}>{t("runKeys")}</button></div>
  </aside>;
}
