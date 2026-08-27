import { ArrowSquareOut, CheckCircle, Circle, MagnifyingGlass, Question, ShieldWarning, Sparkle, X } from "@phosphor-icons/react";
import type { MatchResult } from "../types/item";
import type { InvestigationSession, SearchFacet } from "../types/investigation";

const statusLabels = {
  searching: "Searching",
  needs_clue: "Needs another clue",
  possible_match: "Possible match",
  confirmation_required: "Waiting for you",
  completed: "Completed",
} as const;

function EvidenceList({ title, values, tone }: { title: string; values: string[]; tone: "matched" | "unknown" | "contradiction" }) {
  const Icon = tone === "matched" ? CheckCircle : tone === "unknown" ? Question : ShieldWarning;
  return <div className={`evidence-group ${tone}`}><h4><Icon weight="fill" />{title}</h4>{values.length ? <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul> : <p>None recorded</p>}</div>;
}

export function InvestigationPanel({ session, facets, evidence, onReset, onReview }: {
  session: InvestigationSession;
  facets: SearchFacet[];
  evidence?: MatchResult;
  onReset: () => void;
  onReview: (itemId: string) => void;
}) {
  return (
    <aside className="investigation-panel" aria-label="Active investigation">
      <div className="investigation-header">
        <div><span className="panel-kicker"><Sparkle weight="fill" /> Live investigation</span><h3>{statusLabels[session.status]}</h3></div>
        <button onClick={onReset} aria-label="Reset investigation"><X /></button>
      </div>
      <div className="candidate-summary"><strong>{session.candidateIds.length}</strong><span>current {session.candidateIds.length === 1 ? "candidate" : "candidates"}</span><small>{session.originalQuery}</small></div>
      <section className="timeline-section"><h4>Investigation timeline</h4><ol>{session.searches.map((step, index) => <li key={`${step.id}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.label}</strong><small>{step.candidateCount} {step.candidateCount === 1 ? "candidate" : "candidates"}</small></div></li>)}</ol></section>
      {facets[0] && <section className="next-clue"><span><MagnifyingGlass weight="bold" /> Suggested next clue</span><strong>{facets[0].question_hint}</strong><div>{facets[0].example_values.slice(0, 3).map((value) => <i key={value}>{value}</i>)}</div></section>}
      {evidence && <section className="evidence-card">
        <div className="evidence-heading"><div><span>{evidence.item.id}</span><h4>{evidence.item.name}</h4></div><strong className={`strength ${evidence.match_strength}`}>{evidence.match_strength} match</strong></div>
        <div className="match-score"><strong>{Math.round(evidence.score * 100)}%</strong><span>Match score</span></div>
        <EvidenceList title="Matched" values={evidence.matched} tone="matched" />
        <EvidenceList title="Unknown" values={evidence.unknown} tone="unknown" />
        <EvidenceList title="Contradictions" values={evidence.contradictions} tone="contradiction" />
        <button className="review-match" onClick={() => onReview(evidence.item.id)}>Review match <ArrowSquareOut weight="bold" /></button>
      </section>}
      {!evidence && <div className="evidence-placeholder"><Circle weight="fill" /><p>Compare the candidates to build an evidence card.</p></div>}
      <button className="reset-investigation" onClick={onReset}>Reset investigation</button>
    </aside>
  );
}

export function InvestigationStandby({ onRun }: { onRun: () => void }) {
  return <aside className="investigation-panel standby" aria-label="Demo mode ready">
    <div className="investigation-header"><div><span className="panel-kicker"><Sparkle weight="fill" /> Stable demo mode</span><h3>Ready to investigate</h3></div></div>
    <div className="standby-copy"><MagnifyingGlass weight="duotone" /><h4>Any of the 30 items can be searched.</h4><p>Describe what you remember. Demo mode keeps the dataset and scoring stable—it never forces a scripted result.</p><button className="review-match" onClick={onRun}>Run keys investigation</button></div>
  </aside>;
}
