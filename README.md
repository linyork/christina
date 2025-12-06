# Christina LINE Bot

一個搭載 Gemini AI 的智慧貓娘女僕助手，具備視覺記憶、生活感知與主動關懷能力。

## ✨ 核心特色

- **🧠 強大 AI 大腦**：整合 Google **Gemini 2.5 Flash**，反應快速且聰明。
- **�️ 視覺記憶**：能看懂圖片內容，並將其轉化為文字記憶永久保存。
- **📅 智慧日曆**：雙向整合 Google Calendar，可直接幫主人安排或查詢行程。
- **☀️ 天氣感知**：即時查詢各地天氣狀況，貼心提醒。
- **💬 主動關懷**：具備「虛擬生活感」，會根據時段與氣氛主動找主人聊天。
- **📝 全能記憶**：
  - **長期記憶**：記住重要資訊（如 WiFi 密碼）。
  - **短期記憶**：有時效性的提醒（如晚餐約定）。

## 📁 專案結構

```
christina/
├── Config.gs          # 設定檔（環境變數、System Prompt、API 配置）
├── Utils.gs           # 通用工具函數
├── DB.gs              # Google Sheets ORM (資料庫操作)
├── GoogleDrive.gs     # Drive 檔案操作（含快取機制）
├── GoogleSheet.gs     # Sheets 業務邏輯封裝
├── GoogleCalendar.gs  # Google Calendar API 封裝
├── ChatBot.gs         # Gemini AI 核心（含 Function Calling、RAG、主動發話邏輯）
├── Tools.gs           # AI 工具定義 (Function Calling Schema)
├── Line.gs            # LINE Bot API (含圖片處理)
└── Main.gs            # 主程式入口 (doPost, 定時任務)
```

## 🚀 快速部署

### 使用 clasp（推薦）

```powershell
# 1. 安裝依賴
npm install -g @google/clasp

# 2. 登入 Google
clasp login

# 3. 建立專案
clasp create --title "Christina Bot" --type webapp

# 4. 推送程式碼
clasp push

# 5. 部署
clasp deploy
```

### 首次部署注意事項

由於整合了 Google Calendar，初次執行時需要授權：
1. 部署後，在編輯器中開啟 `Test.gs`。
2. 執行 `runTestCalendar` 函式。
3. 在彈出的視窗中完成 Google 帳號授權。

## ⚙️ 環境變數設定

在 Google Apps Script 專案設定中新增 `Script Properties`：

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `LINE_API_KEY` | LINE Channel Token | [LINE Developers](https://developers.line.biz/) |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | 同上 |
| `SHEET_ID` | Google Sheets ID | 從 Sheets URL 複製 |
| `GEMINI_API_KEY` | Gemini API Key | [AI Studio](https://aistudio.google.com/app/apikey) |
| `ADMIN_STRING` | 主人 LINE User ID | 用 `get_user_id` 工具取得 |

## 📊 資料庫 (Google Sheets) 設定

請建立一個 Google Sheet，並包含以下工作表（Tab）：

| 工作表名稱 | 欄位 (Header) | 用途 |
|-----------|----------------|------|
| `chat` | `userId`, `role`, `content`, `timestamp` | 對話歷史記錄 |
| `knowledge` | `tags`, `content`, `created_at` | 長期記憶庫 (RAG) |
| `short_term_memory`| `key`, `content`, `created_at`, `expires_at` | 短期記憶 (Todo/提醒) |
| `todo` | `content`, `status`, `created_at` | 待辦事項清單 |
| `consolelog` | `type`, `function`, `message`, `time` | 系統日誌 |
| `env` | 自訂 | 環境變數備用 |

## 🤖 AI 能力與指令

現在 Christina 主要透過**自然語言**溝通，不需要死記指令：

- **看圖**：直接傳照片給她 -> 她會回應並記住內容。
- **記帳/行程**：「幫我記下明天晚上吃飯」、「我下週有什麼事？」
- **天氣**：「天氣如何？」、「明天會下雨嗎？」
- **記憶**：「記住我家 WiFi 密碼是 1234」、「我昨天說想吃什麼？」
- **閒聊**：主動關心、撒嬌、梗圖分享。

## 🔧 進階設定 (Config.gs)

```javascript
// 對話記憶與清理
CHAT_MAX_TURNS: 10,        // 給 AI 的上下文輪數
PROACTIVE_CHECK_INTERVAL_HOURS: 2, // 主動發話的最小間隔
GEMINI_MODEL: 'gemini-2.5-flash',  // 使用的模型版本
```

## 📝 開發工作流

```powershell
# 本地開發
code .

# 推送並即時生效
clasp push
```

---
