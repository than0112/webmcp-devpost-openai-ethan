export const PRESENTER_PROMPTS = {
  en: "I lost my brown wallet at the gym yesterday. It had a snap tab and was not a card holder.",
  "zh-TW": "我昨天在體育館掉了棕色皮夾。有按扣，而且不是卡套。",
} as const;

export function presentationFlags(search: string) {
  const params = new URLSearchParams(search);
  return { present: params.get("present") === "true", demo: params.get("demo") === "true" };
}
