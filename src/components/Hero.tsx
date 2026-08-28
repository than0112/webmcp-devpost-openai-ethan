import { ArrowDown, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { useI18n } from "../i18n";

export function Hero({ onBrowse, onDemo }: { onBrowse: () => void; onDemo: () => void }) {
  const { locale, t } = useI18n();
  return (
    <section className="hero" id="top">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkle weight="fill" /> {t("eyebrow")}</span>
        <h1>{t("heroTitle")}<br /><em>{t("heroAccent")}</em></h1>
        <p>{t("heroCopy")}</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onBrowse}><MagnifyingGlass weight="bold" /> {t("browseFound")}</button>
          <button className="text-button" onClick={onDemo}>{t("watchDemo")} <ArrowDown /></button>
        </div>
      </div>
      <div className="hero-art" aria-label="Featured yellow duck umbrella">
        <div className="sunburst" />
        <img src="/items/LF-003.png" alt="Yellow umbrella with a duck illustration" />
        <div className="found-note"><small>{t("bestMatch")}</small><strong>LF-003</strong><span>{locale === "zh-TW" ? "黃色小鴨雨傘" : "Yellow Duck Umbrella"}</span></div>
      </div>
      <p className="tagline">{t("tagline")}</p>
    </section>
  );
}
