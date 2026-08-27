# Agent Lost & Found — SPEC.md

**Version:** 1.1
**Status:** MVP Scope Frozen
**Target:** The WebMCP Challenge
**Build Goal:** 1-day hackathon MVP

---

# 1. Project Overview

Agent Lost & Found 是一個 WebMCP-enabled Lost & Found Web App。

核心概念：

> **Agents search. Humans decide.**

一般使用者可以透過網站 UI 瀏覽失物。

AI Agent 則可以透過 WebMCP 使用網站提供的 structured tools：

```text
search_lost_items
get_item_details
compare_items
request_claim
```

Agent 負責：

```text
Search
↓
Inspect
↓
Compare
↓
Recommend
```

人類負責：

```text
Confirm
↓
Claim
```

本專案不是 AI Chatbot。

核心展示的是：

**同一個網站，同時為 Human UI 與 Agent Interface 設計。**

---

# 2. Product Principle

傳統 Lost & Found：

```text
Human
↓
Search
↓
Filter
↓
Browse
↓
Open
↓
Compare manually
↓
Claim
```

Agent Lost & Found：

```text
Human

"I lost a yellow umbrella
with a wooden handle
and a duck on it."

↓
Agent
↓
WebMCP
↓
Search
↓
Inspect
↓
Compare
↓
Best Match
↓
Human Confirmation
```

WebMCP 必須是產品核心，而不是附加功能。

---

# 3. Hackathon Objective

Demo 必須在約 30 秒內讓第一次接觸 WebMCP 的人理解：

> 網站不再只暴露 UI 給人操作，也能直接暴露 structured capabilities 給 Agent。

Agent 不需要：

* 猜按鈕
* 操作 Filter UI
* Scroll 30 張卡片
* 從 DOM 猜商品資料

而是直接使用網站定義的工具。

---

# 4. MVP Scope

## MUST HAVE

* 30 Lost & Found items
* 30 對應物件 icon
* Lost Item Gallery
* Category Filter
* Basic Human Search
* Item Detail
* WebMCP integration
* `search_lost_items`
* `get_item_details`
* `compare_items`
* `request_claim`
* Agent Activity panel
* Agent-triggered card highlight
* Human Claim Confirmation
* Responsive layout
* Demo Mode
* Cloudflare deployment
* Public GitHub repository
* README
* Open-source LICENSE

---

# 5. Explicitly Out of Scope

V1 不實作：

* Authentication
* Database
* Supabase
* User accounts
* Admin dashboard
* Real email
* Real claim processing
* OpenAI API
* LLM API
* Image recognition
* Vision model
* Embeddings
* Vector database
* RAG
* Maps API
* Payments
* Notifications
* Persistent claim history

資料來源保持：

```text
Static JSON
+
React State
```

圖片只作為 visual representation。

**Agent 搜尋的 source of truth 必須是 structured JSON metadata，而不是 computer vision。**

---

# 6. Tech Stack

```text
Frontend
React
Vite
TypeScript

Styling
Tailwind CSS

WebMCP
Current official WebMCP browser API

Data
Static JSON

State
React useState / useMemo / useEffect

Deployment
Cloudflare Pages

Repository
GitHub
```

禁止為了架構完整度加入不必要的 infrastructure。

---

# 7. Primary Demo Scenario

Hero Item：

```text
LF-003
Yellow Duck Umbrella
```

使用者告訴 Agent：

> I lost an umbrella yesterday. I remember it was yellow, had a wooden curved handle, and there was a small duck on it.

Agent 開始使用 WebMCP。

---

# 8. Primary Demo Flow

## Step 1 — Search

Agent：

```text
search_lost_items({
  category: "umbrella",
  color: "yellow",
  date: "yesterday"
})
```

網站搜尋 Lost & Found dataset。

回傳候選項目。

---

## Step 2 — Inspect

Agent：

```text
get_item_details({
  item_id: "LF-003"
})
```

回傳：

* name
* category
* color
* description
* distinctive features
* found location
* found date
* status
* image
* tags

同時網站：

```text
scrollIntoView(LF-003)
↓
highlight LF-003
```

使用者可以直接看到 Agent 正在查看哪一件物品。

---

# 9. Agent Card Highlight

當 WebMCP 存取特定 Item 時：

對應 Card：

```text
scale: 1.02
border emphasis
soft glow
```

動畫時間：

```text
1000–1500ms
```

不要加入複雜動畫。

目的是讓 WebMCP interaction 在 Demo 中變得可視化。

---

# 10. Compare

如果有多個候選：

```text
compare_items({
  item_ids: [
    "LF-001",
    "LF-002",
    "LF-003",
    "LF-004",
    "LF-005"
  ],
  user_description: {
    category: "umbrella",
    color: "yellow",
    features: [
      "wooden curved handle",
      "duck"
    ],
    date: "yesterday"
  }
})
```

系統執行 deterministic matching。

不使用 AI。

---

# 11. Matching Engine

推薦權重：

```text
Category          +20
Color             +20
Location          +15
Date              +15
Distinct Feature  +15 each
```

最後 normalize：

```text
0.00 → 1.00
```

Hero Case 預期：

```text
LF-003

Match:
0.96
```

實際分數應由 matching algorithm 計算，不允許 hardcode `0.96`。

---

# 12. Compare Response

回傳格式：

```json
{
  "best_match": {
    "item_id": "LF-003",
    "name": "Yellow Duck Umbrella",
    "image": "/items/LF-003.png",
    "score": 0.96,
    "matched_features": [
      "umbrella",
      "yellow",
      "wooden curved handle",
      "duck illustration"
    ],
    "missing_features": []
  }
}
```

如果存在其他候選，可額外回傳：

```json
{
  "alternatives": []
}
```

Agent 必須能解釋：

> Why this item matched.

而不只是顯示 confidence number。

---

# 13. request_claim

當 Agent 認為找到可能物品：

```text
request_claim({
  item_id: "LF-003"
})
```

Response：

```json
{
  "status": "confirmation_required",
  "item_id": "LF-003",
  "message": "Human confirmation is required to claim this item."
}
```

同時網站觸發：

```text
ClaimModal
```

---

# 14. Human-in-the-loop Rule

這是核心產品規則。

Agent 可以：

* 搜尋
* 查看
* 比較
* 推薦
* Request Claim

Agent 不可以：

**Confirm Claim**

最終 claim 必須由人類透過 UI：

```text
Confirm Claim
```

完成。

Tagline：

> **Agents search. Humans decide.**

---

# 15. Dataset

固定：

**30 Items**

每件物品 ID：

```text
LF-001
...
LF-030
```

與 icon 一一對應。

---

# 16. Item Catalog

## Umbrellas

```text
LF-001 Black Umbrella
LF-002 Navy Umbrella
LF-003 Yellow Duck Umbrella
LF-004 Clear Umbrella
LF-005 Folding Umbrella
```

## Bags

```text
LF-006 Canvas Tote Bag
LF-007 Black Backpack
LF-008 Green Backpack
LF-009 Beige Shoulder Bag
LF-010 Navy Messenger Bag
LF-011 Pink Handbag
```

## Wallets

```text
LF-012 Beige Wallet
LF-013 Brown Wallet
LF-014 Card Holder
```

## Keys / Keychains

```text
LF-015 House Keys
LF-016 Car Keys
LF-017 Bear Keychain
LF-018 Heart Keychain
```

## Audio

```text
LF-019 AirPods
LF-020 Headphones
```

## Glasses

```text
LF-021 Round Glasses
LF-022 Black Glasses
```

## Bottles

```text
LF-023 Blue Water Bottle
LF-024 Thermos Bottle
```

## Clothing / Accessories

```text
LF-025 Black Cap
LF-026 Bucket Hat
LF-027 Gray Scarf
LF-028 Black Gloves
```

## Miscellaneous

```text
LF-029 Notebook
LF-030 Black Pen
```

---

# 17. Item Data Schema

`src/data/items.json`

```json
{
  "id": "LF-003",
  "name": "Yellow Duck Umbrella",
  "category": "umbrella",
  "color": [
    "yellow"
  ],
  "description": "Yellow umbrella with a small duck illustration and curved wooden handle.",
  "distinctive_features": [
    "yellow canopy",
    "duck illustration",
    "wooden curved handle"
  ],
  "found_location": "Maple Coffee",
  "found_area": "Downtown",
  "found_date": "2026-08-26",
  "status": "unclaimed",
  "image": "/items/LF-003.png",
  "tags": [
    "umbrella",
    "yellow",
    "duck",
    "wooden-handle",
    "coffee-shop"
  ]
}
```

---

# 18. Asset Structure

所有圖片：

```text
public/items/
```

命名：

```text
LF-001.png
LF-002.png
LF-003.png
...
LF-030.png
```

禁止使用：

```text
umbrella-final-v2.png
bag-new.png
```

ID 必須永遠是圖片與 metadata 的連結。

---

# 19. Data Source of Truth

架構：

```text
             Human UI
                ↑
                │
            items.json
            ↙       ↘
      Icon Assets    WebMCP
                        ↓
                      Agent
```

`items.json` 是唯一 structured source of truth。

Icon 不承擔 metadata extraction。

---

# 20. WebMCP Tool 01

## search_lost_items

用途：

搜尋符合描述的失物。

Input：

```json
{
  "query": "yellow umbrella",
  "category": "umbrella",
  "color": "yellow",
  "location": "coffee shop",
  "date": "2026-08-26"
}
```

所有欄位 optional。

Output：

```json
{
  "count": 1,
  "results": [
    {
      "id": "LF-003",
      "name": "Yellow Duck Umbrella",
      "image": "/items/LF-003.png",
      "found_location": "Maple Coffee",
      "found_date": "2026-08-26"
    }
  ]
}
```

Tool description：

> Search reported lost-and-found items using known attributes. Use this before requesting details or attempting a claim.

---

# 21. WebMCP Tool 02

## get_item_details

Input：

```json
{
  "item_id": "LF-003"
}
```

Output：

完整 item metadata。

Side effect：

```text
highlightItem("LF-003")
scrollToItem("LF-003")
```

---

# 22. WebMCP Tool 03

## compare_items

Input：

```json
{
  "item_ids": [
    "LF-001",
    "LF-002",
    "LF-003"
  ],
  "user_description": {
    "category": "umbrella",
    "color": "yellow",
    "features": [
      "wooden handle",
      "duck"
    ]
  }
}
```

Output：

```json
{
  "best_match": {},
  "alternatives": []
}
```

Response 必須包含：

* score
* matched_features
* missing_features

---

# 23. WebMCP Tool 04

## request_claim

Input：

```json
{
  "item_id": "LF-003"
}
```

Output：

```json
{
  "status": "confirmation_required",
  "item_id": "LF-003"
}
```

Side effect：

```text
openClaimModal("LF-003")
```

---

# 24. Agent Activity Panel

Desktop：

右下角固定小 Panel。

Mobile：

可以 collapse。

內容：

```text
Agent Activity

✓ search_lost_items
  Found 5 umbrellas

✓ get_item_details
  Inspecting LF-003

✓ compare_items
  96% match

→ request_claim
  Waiting for human
```

每次 WebMCP tool call：

更新 activity state。

目的：

**讓評審看得見 Agent 正在使用網站提供的能力。**

---

# 25. Homepage

Hero：

```text
AGENT LOST & FOUND

Lost something?

Let your agent help find it.

Describe what you remember.
Your agent can search and compare
reported items directly.

[ Browse Found Items ]
```

Supporting line：

> Agents search. Humans decide.

---

# 26. Recently Found

Hero 下方：

```text
Recently Found
```

展示約：

```text
LF-003
LF-007
LF-015
LF-019
```

---

# 27. Item Gallery

Header：

```text
Found Items

30 items currently waiting
to find their owners.
```

Filters：

```text
All
Umbrellas
Bags
Wallets
Keys
Audio
Glasses
Bottles
Accessories
Other
```

Desktop：

```text
5–6 columns
```

Tablet：

```text
3–4 columns
```

Mobile：

```text
2 columns
```

---

# 28. Item Card

內容：

```text
ICON

LF-003

Yellow Duck Umbrella

Maple Coffee
Aug 26

View Item →
```

Hover：

```text
small translateY
subtle shadow
```

Agent Highlight：

```text
border emphasis
scale 1.02
soft glow
```

---

# 29. Item Detail

內容：

```text
ICON

LF-003

Yellow Duck Umbrella

Found at
Maple Coffee

Found
August 26

Details

Yellow canopy
Wooden curved handle
Small duck illustration

Status

● Unclaimed
```

---

# 30. Claim Modal

```text
Possible Match Found

[ICON]

Yellow Duck Umbrella

LF-003

Found
Maple Coffee

Date
August 26

Matched clues

✓ Umbrella
✓ Yellow
✓ Wooden handle
✓ Duck illustration

Match confidence

96%

[ Cancel ]

[ Confirm Claim ]
```

Confirm 後：

```text
Claim Request Created
```

不送 API。

只更新 React state。

---

# 31. Visual Direction

風格：

**Friendly civic utility × editorial product design**

不要：

* Government portal aesthetic
* Generic AI gradients
* Cyberpunk
* Excessive glassmorphism
* Heavy animations
* Dashboard overload

推薦：

```text
Background
Warm off-white

Cards
White

Primary
Deep navy

Accent
Soft yellow

Success
Muted green
```

Typography：

```text
Inter
```

可選：

Serif display font 只用於 Hero。

---

# 32. State

只需要：

```ts
selectedItem
searchFilters
highlightedItem
claimCandidate
claimStatus
agentActivity
```

使用：

```text
useState
useMemo
useEffect
```

禁止 Redux。

---

# 33. File Structure

```text
agent-lost-found/

├── public/
│   └── items/
│       ├── LF-001.png
│       ├── LF-002.png
│       ├── ...
│       └── LF-030.png
│
├── src/
│
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemGrid.tsx
│   │   ├── ItemDetail.tsx
│   │   ├── SearchFilters.tsx
│   │   ├── ClaimModal.tsx
│   │   └── AgentActivity.tsx
│
│   ├── data/
│   │   └── items.json
│
│   ├── lib/
│   │   ├── search.ts
│   │   ├── matching.ts
│   │   └── webmcp.ts
│
│   ├── hooks/
│   │   └── useWebMCP.ts
│
│   ├── types/
│   │   └── item.ts
│
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── README.md
├── LICENSE
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

# 34. Main Data Flow

```text
items.json
    ↓
    ├──────────── Human UI
    │
    └──────────── WebMCP
                       ↓
                     Agent
                       ↓
              search_lost_items
                       ↓
              get_item_details
                       ↓
                 Highlight
                       ↓
                compare_items
                       ↓
                  Best Match
                       ↓
                request_claim
                       ↓
                  ClaimModal
                       ↓
             Human Confirmation
```

---

# 35. Error Handling

## No Results

```text
No matching items found.

Try removing one detail.
```

## Invalid ID

```text
Item not found.
```

## WebMCP Unsupported

```text
WebMCP isn't available in this browser.

You can still browse found items manually.
```

網站 Human UI 必須繼續正常運作。

## Claim Error

```text
Unable to start claim confirmation.

Please open the item manually.
```

---

# 36. Demo Mode

支援：

```text
/?demo=true
```

Demo Mode：

* 30 items 固定
* LF-003 Hero Case
* Agent Activity 預設 visible
* Claim state reset
* No randomness
* Matching deterministic

每次 Demo 結果必須一致。

---

# 37. Demo Script

影片目標：

**90–120 seconds**

## 0–10s

展示 30 items。

旁白：

> Lost-and-found websites usually make people manually search through dozens of similar items.

---

## 10–20s

> Agent Lost & Found exposes the same website directly to AI agents using WebMCP.

---

## 20–30s

Prompt：

> I lost an umbrella yesterday. It was yellow, had a wooden curved handle, and there was a small duck on it.

---

## 30–45s

Agent Activity：

```text
search_lost_items

5 candidates found
```

---

## 45–55s

```text
get_item_details

LF-003
```

Gallery：

LF-003 自動 highlight。

---

## 55–70s

```text
compare_items

LF-003

96% match
```

Agent 說明：

```text
Yellow
Wooden handle
Duck illustration
```

---

## 70–85s

```text
request_claim
```

ClaimModal 出現。

---

## 85–100s

旁白：

> The agent can search, inspect and compare.

> But it cannot claim the item for me.

人類：

```text
Confirm Claim
```

---

## 100–110s

Ending：

```text
Agent Lost & Found

Agents search.
Humans decide.
```

---

# 38. Acceptance Criteria

* [ ] 30 icons loaded
* [ ] LF-001 → LF-030 mapping correct
* [ ] 30 item metadata records
* [ ] Gallery renders correctly
* [ ] Category filters work
* [ ] Human search works
* [ ] Item detail works
* [ ] WebMCP detected
* [ ] `search_lost_items` works
* [ ] `get_item_details` works
* [ ] Agent can trigger LF-003 highlight
* [ ] `compare_items` works
* [ ] Matching is deterministic
* [ ] Matched features returned
* [ ] `request_claim` works
* [ ] ClaimModal triggered
* [ ] Agent cannot confirm claim
* [ ] Human can confirm claim
* [ ] Agent Activity updates
* [ ] Unsupported browser fallback works
* [ ] Mobile usable
* [ ] Demo Mode works
* [ ] Cloudflare deployment works
* [ ] ChatGPT in-app browser tested
* [ ] WebMCP-enabled Chrome tested
* [ ] Public GitHub repository
* [ ] Open-source LICENSE
* [ ] README contains testing instructions
* [ ] Demo video prepared

---

# 39. Build Priority

## P0 — Foundation

```text
React
↓
Tailwind
↓
30 icons
↓
items.json
↓
Gallery
```

## P1 — Matching

```text
Search
↓
Filters
↓
matching.ts
```

## P2 — WebMCP Core

```text
search_lost_items
↓
get_item_details
```

**Do not continue until these work.**

## P3 — Agent Experience

```text
highlight
↓
compare_items
↓
Agent Activity
```

## P4 — Human-in-the-loop

```text
request_claim
↓
ClaimModal
↓
Confirm Claim
```

## P5 — Submission

```text
Visual polish
↓
Cloudflare
↓
README
↓
Testing
↓
Demo Video
```

---

# 40. One-Day Build Rule

如果時間不足，按照以下順序砍：

```text
Animations
↓
Advanced filters
↓
Item Detail polish
↓
Recently Found
↓
Mobile polish
```

不得砍：

```text
WebMCP
search_lost_items
get_item_details
compare_items
request_claim
Human Confirmation
```

---

# 41. Definition of Done

MVP 最重要的驗收場景：

使用者：

> I lost an umbrella yesterday. It was yellow, had a wooden curved handle, and there was a small duck on it.

Agent：

```text
Search
↓
Inspect
↓
Compare
↓
LF-003
↓
Highlight
↓
Request Claim
```

網站：

```text
Possible Match Found
```

人類：

```text
Confirm Claim
```

如果這條流程能夠在正式部署環境中穩定重現：

**MVP 即視為完成。**

---

# 42. Scope Freeze

Version 1.1 完成以前，不加入任何新功能。

禁止臨時加入：

```text
Vision
RAG
Database
Login
Maps
Real claims
Chatbot
LLM API
Admin
```

任何新想法統一移至：

```text
V2_BACKLOG.md
```

而不是修改 MVP。

最終產品必須始終能用一句話解釋：

> **Agents search. Humans decide.**
