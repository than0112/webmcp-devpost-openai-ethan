import { MagnifyingGlass } from "@phosphor-icons/react";
import { useI18n } from "../i18n";
export function EmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useI18n();
  return <div className="empty-state"><MagnifyingGlass /><h3>{t("noMatches")}</h3><p>{t("removeDetail")}</p><button onClick={onReset}>{t("clearSearch")}</button></div>;
}
