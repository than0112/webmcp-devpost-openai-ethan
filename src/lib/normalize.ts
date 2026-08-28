const STOP_WORDS = new Set([
  "a", "an", "and", "at", "can", "find", "for", "from", "i", "in", "is", "it", "lost", "me", "my", "of", "on", "please", "something", "the", "this", "to", "was", "with",
  "一個", "了", "在", "我的", "我", "掉了", "遺失", "請", "幫我", "找", "找到", "東西", "這個",
]);

const ZH_PHRASE_ALIASES: Array<[string, string]> = [
  ["白色無線耳機", "white earbuds"], ["黃色小鴨雨傘", "yellow duck umbrella"], ["黑色原子筆", "black pen"],
  ["帆布托特包", "canvas bag"], ["海軍藍雨傘", "navy umbrella"], ["藍色水壺", "blue bottle"],
  ["米色肩背包", "beige bag"], ["海軍藍郵差包", "navy bag"], ["粉紅色手提包", "pink bag"],
  ["棕色皮夾", "brown wallet"], ["米色皮夾", "beige wallet"], ["房屋鑰匙", "house key"],
  ["汽車鑰匙", "car key"], ["小熊鑰匙圈", "bear key"], ["愛心鑰匙圈", "heart key"],
  ["耳罩式耳機", "headphones"], ["圓框眼鏡", "round glasses"], ["黑框眼鏡", "black glasses"],
  ["米色保溫瓶", "beige bottle"], ["黑色棒球帽", "black hat"], ["米色漁夫帽", "beige hat"],
  ["灰色圍巾", "gray scarf"], ["黑色手套", "black gloves"], ["黃色筆記本", "yellow notebook"],
  ["黑色後背包", "black bag"], ["綠色後背包", "green bag"], ["透明雨傘", "clear umbrella"],
  ["折疊雨傘", "folding umbrella"], ["卡片套", "card holder"], ["卡套", "card holder"],
  ["體育館", "gym"], ["健身房", "gym"], ["按扣", "snap tab"], ["皮革", "leather"],
  ["小鴨", "duck"], ["鴨子", "duck"], ["後背包", "bag"], ["背包", "bag"],
  ["肩背包", "bag"], ["郵差包", "bag"], ["手提包", "bag"], ["托特包", "bag"],
  ["雨傘", "umbrella"], ["皮夾", "wallet"], ["錢包", "wallet"], ["鑰匙圈", "key"],
  ["鑰匙", "key"], ["無線耳機", "earbuds"], ["耳機", "audio"], ["眼鏡", "glasses"],
  ["保溫瓶", "bottle"], ["水壺", "bottle"], ["棒球帽", "hat"], ["漁夫帽", "hat"],
  ["帽子", "hat"], ["圍巾", "scarf"], ["手套", "gloves"], ["筆記本", "notebook"],
  ["原子筆", "pen"], ["包包", "bag"], ["配件", "accessory"], ["音訊設備", "audio"],
  ["瓶罐", "bottle"], ["其他", "other"], ["昨天", "yesterday"], ["今天", "today"], ["黑色", "black"],
  ["海軍藍", "navy"], ["藍色", "blue"], ["黃色", "yellow"], ["透明", "clear"],
  ["米色", "beige"], ["棕色", "brown"], ["綠色", "green"], ["橄欖綠", "olive"],
  ["粉紅色", "pink"], ["粉紅", "pink"], ["銀色", "silver"], ["金色", "gold"],
  ["紅色", "red"], ["白色", "white"], ["灰色", "gray"], ["奶油色", "cream"], ["橘色", "orange"],
];

const PHRASE_ALIASES: Array<[string, string]> = [
  ["wireless airpods", "earbuds"],
  ["wireless earbuds", "earbuds"],
  ["shoulder bag", "bag"],
  ["messenger bag", "bag"],
  ["canvas tote", "bag"],
  ["tote bag", "bag"],
  ["water bottle", "bottle"],
  ["bucket hat", "hat"],
  ["key chain", "keychain"],
  ["key ring", "keychain"],
  ["house keys", "house key"],
  ["car keys", "car key"],
];

const TOKEN_ALIASES: Record<string, string> = {
  airpod: "earbuds",
  airpods: "earbuds",
  backpack: "bag",
  backpacks: "bag",
  cap: "hat",
  earbuds: "earbuds",
  earphone: "earbuds",
  earphones: "earbuds",
  eyeglass: "glasses",
  eyeglasses: "glasses",
  handbag: "bag",
  handbags: "bag",
  keychain: "key",
  keychains: "key",
  spectacles: "glasses",
  thermos: "bottle",
  totes: "bag",
};

const CATEGORY_ALIASES: Record<string, string> = {
  airpod: "audio",
  airpods: "audio",
  backpack: "bag",
  bag: "bag",
  earbuds: "audio",
  earphones: "audio",
  gloves: "accessory",
  handbag: "bag",
  hat: "accessory",
  headphones: "audio",
  key: "keys",
  keychain: "keys",
  keys: "keys",
  messenger: "bag",
  pen: "other",
  scarf: "accessory",
  thermos: "bottle",
  tote: "bag",
};

export const normalizeText = (value: string) =>
  value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function singularize(token: string) {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

export function canonicalizeText(value: string) {
  let canonical = ` ${normalizeText(value)} `;
  for (const [alias, replacement] of [...ZH_PHRASE_ALIASES].sort((left, right) => right[0].length - left[0].length)) {
    canonical = canonical.replaceAll(alias, ` ${replacement} `);
  }
  canonical = canonical.replace(/\s+/g, " ");
  for (const [alias, replacement] of PHRASE_ALIASES) {
    canonical = canonical.replaceAll(` ${alias} `, ` ${replacement} `);
  }
  return canonical.trim();
}

export function tokenize(value: string) {
  return canonicalizeText(value)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token))
    .map((token) => TOKEN_ALIASES[token] ?? singularize(token));
}

export function hasAllTokens(text: string, clue: string) {
  const haystack = new Set(tokenize(text));
  const needles = tokenize(clue);
  return needles.length > 0 && needles.every((token) => haystack.has(token));
}

export function normalizeClue(value: string) {
  return tokenize(value).join(" ");
}

export function normalizeCategory(value?: string) {
  const normalized = canonicalizeText(value ?? "");
  return CATEGORY_ALIASES[normalized] ?? normalized;
}
