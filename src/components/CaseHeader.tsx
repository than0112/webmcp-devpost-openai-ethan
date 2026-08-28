import { ArrowCounterClockwise, CheckCircle, Clock, FolderOpen } from "@phosphor-icons/react";
import { useI18n } from "../i18n";

export function CaseHeader({ caseId, updatedAt, restored, onReset }: { caseId: string; updatedAt: number; restored: boolean; onReset: () => void }) {
  const { locale, t } = useI18n();
  const formatted = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(updatedAt));
  return <section className="case-header" aria-label={`${t("caseLabel")} ${caseId}`}>
    <div className="case-identity"><FolderOpen weight="duotone" /><span><small>{t("caseLabel")}</small><strong>{caseId}</strong></span></div>
    <div className="case-state"><span><CheckCircle weight="fill" />{restored ? t("restored") : t("saved")}</span><span><Clock />{t("updatedLabel")} {formatted}</span></div>
    <button onClick={onReset}><ArrowCounterClockwise />{t("resetCase")}</button>
  </section>;
}
