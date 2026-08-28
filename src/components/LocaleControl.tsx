import type { SupportedLocale } from "../types/casefile";

export function LocaleControl({ locale, onChange }: { locale: SupportedLocale; onChange: (locale: SupportedLocale) => void }) {
  return <div className="locale-control" role="group" aria-label="Language / 語言">
    <button className={locale === "en" ? "active" : ""} onClick={() => onChange("en")} lang="en">English</button>
    <button className={locale === "zh-TW" ? "active" : ""} onClick={() => onChange("zh-TW")} lang="zh-TW">繁體中文</button>
  </div>;
}
