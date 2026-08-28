import { useMemo, useState } from "react";
import { ArrowCounterClockwise, Check, MinusCircle, PencilSimple, Plus, Question, X } from "@phosphor-icons/react";
import type { SearchClue } from "../types/investigation";
import type { ClueMutation } from "../lib/clue-mutations";
import { clueActionReason, groupClues } from "../lib/clue-board";
import { useI18n } from "../i18n";

const clueKinds = ["feature", "category", "color", "location", "date"] as const;

export function ClueBoard({ clues, unknownValues = [], canUndo, feedback, onMutation, onUndo }: {
  clues: SearchClue[];
  unknownValues?: string[];
  canUndo: boolean;
  feedback?: string;
  onMutation: (mutation: ClueMutation) => void;
  onUndo: () => void;
}) {
  const { locale } = useI18n();
  const zh = locale === "zh-TW";
  const labels = zh ? {
    title: "線索板", positive: "有效線索", negative: "排除線索", unknown: "待確認", empty: "尚無線索",
    value: "輸入線索", kind: "線索類型", add: "新增", reject: "排除", replace: "修正", undo: "復原上次變更",
    choose: "選擇要修正的線索", replacement: "輸入修正後的線索", duplicate: "這項線索已存在。", invalid: "請輸入有效線索。",
    remove: "排除", feature: "特徵", category: "類別", color: "顏色", location: "地點", date: "日期",
  } : {
    title: "Clue Board", positive: "Positive", negative: "Negative", unknown: "Unknown", empty: "No clues yet",
    value: "Enter a clue", kind: "Clue type", add: "Add", reject: "Reject", replace: "Correct", undo: "Undo last change",
    choose: "Choose a clue to correct", replacement: "Enter the corrected clue", duplicate: "This clue is already active.", invalid: "Enter a valid clue.",
    remove: "Reject", feature: "Feature", category: "Category", color: "Color", location: "Location", date: "Date",
  };
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<SearchClue["kind"]>("feature");
  const [replaceKey, setReplaceKey] = useState("");
  const [replacement, setReplacement] = useState("");
  const groups = useMemo(() => groupClues(clues, unknownValues), [clues, unknownValues]);
  const draft = { kind, value, source: "human" } satisfies SearchClue;
  const addReason = clueActionReason(clues, draft, "add");
  const rejectReason = clueActionReason(clues, draft, "reject");
  const selected = clues.find((clue) => `${clue.kind}:${clue.value}` === replaceKey);
  const replacementReason = selected ? clueActionReason(clues.filter((clue) => clue !== selected), { ...selected, value: replacement }, "add") : "invalid";

  function submit(mutation: ClueMutation) {
    onMutation(mutation);
    setValue("");
  }

  return <section className="clue-board" aria-labelledby="clue-board-title">
    <div className="clue-board-heading"><h4 id="clue-board-title">{labels.title}</h4><button type="button" onClick={onUndo} disabled={!canUndo}><ArrowCounterClockwise /> {labels.undo}</button></div>
    <div className="clue-groups">
      {(["positive", "negative", "unknown"] as const).map((group) => <div className={`clue-group ${group}`} key={group}>
        <strong>{group === "positive" ? <Check /> : group === "negative" ? <MinusCircle /> : <Question />}{labels[group]}</strong>
        <div>{groups[group].length ? groups[group].map((clue) => <span className="clue-chip" key={`${clue.kind}:${clue.value}`}>{clue.value}{group !== "negative" && <button type="button" onClick={() => submit({ action: "reject", clue })} aria-label={`${labels.remove} ${clue.value}`}><X /></button>}</span>) : <small>{labels.empty}</small>}</div>
      </div>)}
    </div>
    <div className="clue-editor">
      <label><span>{labels.kind}</span><select value={kind} onChange={(event) => setKind(event.target.value as SearchClue["kind"])}>{clueKinds.map((entry) => <option key={entry} value={entry}>{labels[entry]}</option>)}</select></label>
      <label className="clue-value"><span>{labels.value}</span><input value={value} onChange={(event) => setValue(event.target.value)} placeholder={labels.value} maxLength={120} /></label>
      <button type="button" disabled={Boolean(addReason)} onClick={() => submit({ action: "add", clue: draft })}><Plus /> {labels.add}</button>
      <button type="button" disabled={Boolean(rejectReason)} onClick={() => submit({ action: "reject", clue: draft })}><MinusCircle /> {labels.reject}</button>
    </div>
    {value && (addReason || rejectReason) && <p className="clue-feedback" role="status">{(addReason ?? rejectReason) === "duplicate" ? labels.duplicate : labels.invalid}</p>}
    <div className="clue-replace">
      <label><span>{labels.choose}</span><select value={replaceKey} onChange={(event) => setReplaceKey(event.target.value)}><option value="">{labels.choose}</option>{clues.filter((clue) => clue.kind !== "negative").map((clue) => <option key={`${clue.kind}:${clue.value}`} value={`${clue.kind}:${clue.value}`}>{clue.value}</option>)}</select></label>
      <label><span>{labels.replacement}</span><input value={replacement} onChange={(event) => setReplacement(event.target.value)} placeholder={labels.replacement} maxLength={120} /></label>
      <button type="button" disabled={!selected || Boolean(replacementReason)} onClick={() => { if (selected) { onMutation({ action: "replace", previous: selected, next: { ...selected, value: replacement, source: "human" } }); setReplacement(""); } }}><PencilSimple /> {labels.replace}</button>
    </div>
    {feedback && <p className="clue-feedback" role="status">{feedback}</p>}
  </section>;
}
