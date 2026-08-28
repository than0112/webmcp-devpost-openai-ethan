import { createContext, useContext, type ReactNode } from "react";
import type { LostItem, LocalizedItemText } from "../types/item";
import type { SupportedLocale } from "../types/casefile";

const en = {
  browse: "Browse items", how: "How it works", ready: "Agent-ready", eyebrow: "A better way to look",
  heroTitle: "Lost something?", heroAccent: "Let your agent help.", heroCopy: "Describe what you remember. Your agent can search and compare reported items directly—without scrolling through every card.",
  browseFound: "Browse found items", watchDemo: "Watch agent demo", bestMatch: "Best match", tagline: "Agents search. Humans decide.",
  placeholder: "Describe anything: brown wallet, round glasses, house keys…", clearSearch: "Clear search", runSearch: "Run agent search", filterCategory: "Filter by category",
  all: "All", umbrella: "Umbrellas", bag: "Bags", wallet: "Wallets", keys: "Keys", audio: "Audio", glasses: "Glasses", bottle: "Bottles", accessory: "Accessories", other: "Other",
  viewItem: "View item", foundAt: "Found at", found: "Found", details: "Identifying details", unclaimed: "Unclaimed", mightMine: "This might be mine", close: "Close",
  noMatches: "No matching items found.", removeDetail: "Try removing or correcting one detail.", agentActivity: "Agent Activity", toolsRegistered: "WebMCP tools registered", manualMode: "Manual browsing mode", noCalls: "No agent calls yet.", runDemo: "Run current search as demo",
  confirmationRequired: "Human confirmation required", possibleFound: "Possible match found", match: "match", matchedClues: "Matched clues", agentStopped: "The agent stopped here.", onlyConfirm: "Only you can confirm this claim.", cancel: "Cancel", confirmClaim: "Confirm claim", humanConfirmed: "Human confirmed", claimCreated: "Claim request created", demoRecorded: "Your confirmation has been recorded for this demo. No external request was sent.", backItems: "Back to found items",
  freshReports: "Fresh reports", recentlyFound: "Recently found", viewAll: "View all 30", humanAgent: "Human + agent", shorterPath: "A shorter path back to what’s yours.", shorterCopy: "The same catalog is designed for people to browse and for browser agents to query through structured WebMCP tools.",
  search: "Search", searchCopy: "Your agent searches structured item data, not screenshots.", compare: "Compare", compareCopy: "Deterministic clues explain why one item stands out.", decide: "You decide", decideCopy: "The agent can request a claim. Only you can confirm it.", community: "Community catalog", foundItems: "Found items", waiting: "items are currently waiting to find their owners.", updated: "Updated Aug 27, 2026", matches: "matches", matchOne: "match", built: "Built for the agentic web.",
  restored: "Restored case", saved: "Saved locally", caseLabel: "Case", updatedLabel: "Updated", resetCase: "Reset case", resetConfirm: "Reset this saved case and its investigation history?",
  liveInvestigation: "Live investigation", searching: "Searching", needsClue: "Needs another clue", possibleMatch: "Possible match", waitingYou: "Waiting for you", completed: "Completed", currentCandidate: "current candidate", currentCandidates: "current candidates", timeline: "Investigation timeline", suggested: "Suggested next clue", matched: "Matched", unknown: "Unknown", contradictions: "Contradictions", noneRecorded: "None recorded", reviewMatch: "Review match", comparePrompt: "Compare the candidates to build an evidence card.", resetInvestigation: "Reset investigation", stableDemo: "Stable demo mode", readyInvestigate: "Ready to investigate", allSearchable: "Any of the 30 items can be searched.", stableCopy: "Describe what you remember. Demo mode keeps the dataset and scoring stable—it never forces a scripted result.", runKeys: "Run keys investigation", matchScore: "Match score",
} as const;

type MessageKey = keyof typeof en;
const zhTW: Record<MessageKey, string> = {
  browse: "瀏覽物品", how: "運作方式", ready: "支援 Agent", eyebrow: "更有效率的尋物方式",
  heroTitle: "遺失物品了嗎？", heroAccent: "讓你的 Agent 幫忙。", heroCopy: "描述你還記得的線索。Agent 可以直接搜尋並比較通報物品，不必逐張翻找。",
  browseFound: "瀏覽拾獲物品", watchDemo: "觀看 Agent 示範", bestMatch: "最佳候選", tagline: "Agent 搜尋，人類決定。",
  placeholder: "描述任何線索：棕色皮夾、圓框眼鏡、房屋鑰匙…", clearSearch: "清除搜尋", runSearch: "啟動 Agent 搜尋", filterCategory: "依類別篩選",
  all: "全部", umbrella: "雨傘", bag: "包包", wallet: "皮夾", keys: "鑰匙", audio: "音訊設備", glasses: "眼鏡", bottle: "瓶罐", accessory: "配件", other: "其他",
  viewItem: "查看物品", foundAt: "拾獲地點", found: "拾獲日期", details: "辨識特徵", unclaimed: "尚未認領", mightMine: "這可能是我的", close: "關閉",
  noMatches: "找不到符合的物品。", removeDetail: "請移除或修正一項線索。", agentActivity: "Agent 活動", toolsRegistered: "WebMCP 工具已註冊", manualMode: "手動瀏覽模式", noCalls: "尚無 Agent 呼叫。", runDemo: "以目前搜尋執行示範",
  confirmationRequired: "需要人類確認", possibleFound: "找到可能相符的物品", match: "相符", matchedClues: "相符線索", agentStopped: "Agent 已在此停止。", onlyConfirm: "只有你能確認這次認領。", cancel: "取消", confirmClaim: "確認認領", humanConfirmed: "已由人類確認", claimCreated: "已建立認領請求", demoRecorded: "此確認只記錄於示範中，未送出任何外部請求。", backItems: "返回拾獲物品",
  freshReports: "最新通報", recentlyFound: "最近拾獲", viewAll: "查看全部 30 件", humanAgent: "人類 + Agent", shorterPath: "更短的尋回路徑。", shorterCopy: "同一份物品目錄同時供人類瀏覽，也讓瀏覽器 Agent 透過結構化 WebMCP 工具查詢。",
  search: "搜尋", searchCopy: "Agent 搜尋結構化物品資料，而不是判讀畫面截圖。", compare: "比較", compareCopy: "確定性的線索能解釋某件物品為何更突出。", decide: "由你決定", decideCopy: "Agent 可以請求認領，但只有你能完成確認。", community: "社群物品目錄", foundItems: "拾獲物品", waiting: "件物品正等待失主認領。", updated: "更新於 2026 年 8 月 27 日", matches: "筆相符", matchOne: "筆相符", built: "為 Agentic Web 打造。",
  restored: "已恢復案件", saved: "已儲存於本機", caseLabel: "案件", updatedLabel: "更新", resetCase: "重設案件", resetConfirm: "要重設此案件及其調查紀錄嗎？",
  liveInvestigation: "即時調查", searching: "搜尋中", needsClue: "需要更多線索", possibleMatch: "可能相符", waitingYou: "等待你確認", completed: "已完成", currentCandidate: "個目前候選", currentCandidates: "個目前候選", timeline: "調查時間軸", suggested: "建議的下一項線索", matched: "相符", unknown: "未知", contradictions: "矛盾", noneRecorded: "尚無紀錄", reviewMatch: "檢視候選", comparePrompt: "比較候選物品後即可建立證據卡。", resetInvestigation: "重設調查", stableDemo: "穩定示範模式", readyInvestigate: "準備開始調查", allSearchable: "30 件物品都可以搜尋。", stableCopy: "描述你記得的線索。示範模式只固定資料與評分，不會強制指定結果。", runKeys: "執行鑰匙調查", matchScore: "相符分數",
};

const catalogs: Record<SupportedLocale, Record<MessageKey, string>> = { en, "zh-TW": zhTW };
const I18nContext = createContext({ locale: "en" as SupportedLocale, t: (key: MessageKey) => en[key] as string });

export function I18nProvider({ locale, children }: { locale: SupportedLocale; children: ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: (key) => catalogs[locale][key] }}>{children}</I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }

export function itemText(item: LostItem, locale: SupportedLocale): LocalizedItemText {
  if (locale === "zh-TW" && item.localized?.["zh-TW"]) return item.localized["zh-TW"];
  return { name: item.name, category: item.category, color: item.color, description: item.description, distinctive_features: item.distinctive_features, found_location: item.found_location, found_area: item.found_area, tags: item.tags };
}
