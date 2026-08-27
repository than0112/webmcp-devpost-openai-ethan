const STOP_WORDS = new Set([
  "a", "an", "and", "at", "can", "find", "for", "from", "i", "in", "is", "it", "lost", "me", "my", "of", "on", "please", "the", "this", "to", "was", "with",
]);

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
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

function singularize(token: string) {
  if (token.endsWith("ies") && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 3) return token.slice(0, -1);
  return token;
}

export function canonicalizeText(value: string) {
  let canonical = ` ${normalizeText(value)} `;
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
  const normalized = normalizeText(value ?? "");
  return CATEGORY_ALIASES[normalized] ?? normalized;
}
