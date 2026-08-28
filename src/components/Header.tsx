import { Binoculars, List, X } from "@phosphor-icons/react";
import { useState } from "react";
import type { SupportedLocale } from "../types/casefile";
import { useI18n } from "../i18n";
import { LocaleControl } from "./LocaleControl";

export function Header({ onBrowse, locale, onLocale }: { onBrowse: () => void; locale: SupportedLocale; onLocale: (locale: SupportedLocale) => void }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="Agent Lost and Found home">
        <span className="brand-mark"><Binoculars weight="bold" /></span>
        <span>Agent Lost <i>&amp;</i> Found</span>
      </a>
      <button className="nav-toggle" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X /> : <List />}</button>
      <nav className={open ? "nav open" : "nav"}>
        <button onClick={onBrowse}>{t("browse")}</button>
        <a href="#how-it-works">{t("how")}</a>
        <span className="agent-ready"><span /> {t("ready")}</span>
        <LocaleControl locale={locale} onChange={onLocale} />
      </nav>
    </header>
  );
}
