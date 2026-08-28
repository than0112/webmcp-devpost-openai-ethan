import { ArrowCounterClockwise, Copy, PresentationChart } from "@phosphor-icons/react";
import { copyPresenterPrompt } from "../lib/presenter";
import { useI18n } from "../i18n";

export function PresenterControls({ onReset }: { onReset: () => void }) {
  const { locale } = useI18n();
  const zh = locale === "zh-TW";
  async function copyPrompt(language: "en" | "zh-TW") {
    await copyPresenterPrompt(language, navigator.clipboard);
  }
  return <section className="presenter-controls" aria-label={zh ? "展示模式控制" : "Presenter controls"}>
    <strong><PresentationChart weight="fill" /> {zh ? "V3 展示模式" : "V3 Presenter Mode"}</strong>
    <div>
      <button type="button" onClick={() => copyPrompt("en")}><Copy /> English prompt</button>
      <button type="button" onClick={() => copyPrompt("zh-TW")}><Copy /> 中文提示詞</button>
      <button type="button" className="presenter-reset" onClick={onReset}><ArrowCounterClockwise /> {zh ? "一鍵重設" : "One-click reset"}</button>
    </div>
  </section>;
}
