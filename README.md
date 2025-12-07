# Christina LINE Bot (AI-First Assistant)

一個搭載 Google **Gemini 2.0 Flash** 的 AI-First 智慧貓娘女僕助手。  
不僅具備視覺記憶與生活感知，更擁有獨立的「思維中樞 (Mind)」，能進行內心獨白 (Shadow Thinking)、感知情緒狀態，並主動關懷主人。

## ✨ 核心特色

### 🧠 雙重思維系統 (System 1 + System 2)
- **表層對話 (Reply)**：符合貓娘人設的傲嬌/貼心回應。
- **深層思考 (Shadow Thinking)**：在回覆前進行內心獨白，分析主人的情緒 (Sentiment)、能量 (Energy) 與意圖 (Intent)，並決定將哪些資訊轉存為長期事實。

### ❤️ 好感度與狀態系統
- **好感度 (Affection)**：從 Lv.1 (點頭之交) 到 Lv.5 (永恆羈絆)，隨著互動累積，Christina 的語氣與態度會隨之改變。
- **狀態矩陣 (State Matrix)**：AI 會根據對話推測主人的 mood (情緒), energy (能量), busyness (忙碌度)，並調整自己的應對策略。

### 🛠️ 極致優化的工具系統 (Token Reduction)
為了在維持強大功能的同時降低 API 成本，我們將工具整合為 5 大核心：
1. **`manage_memory`**：全能記憶管理（長期知識 vs 短期提醒，嚴格區分）。
2. **`manage_calendar`**：行事曆增刪改查。
3. **`manage_todo`**：待辦事項管理。
4. **`search_web`**：Google 聯網搜尋（新聞、評價、即時資訊）。
5. **`system_control`**：系統控制（清理記憶、狀態查詢等）。

### ⏰ 動態自我排程 (Dynamic Self-Scheduling)
- **自主意識**：摒棄傳統的固定輪詢 (Cron Job)，Christina 擁有自己的時間感。
- **動態決策**：每次互動結束後，她會根據當下情境（深夜、熱聊中、工作中）自行決定「下一次什麼時候醒來」。
- **即時重置**：主人的每一句話都會「喚醒」並重置她的生理時鐘，真正模擬人與人的互動節奏。

---

## 📁 專案結構

```
christina/
├── Config.gs          # 全域設定（環境變數、System Prompts、模型參數）
├── Main.gs            # 主程式入口 (Webhook doPost, 定時觸發任務)
├── ChatBot.gs         # 對話核心 (負責協調 GeminiService, Mind, Tools)
├── Mind.gs            # 思維中樞 (狀態管理、Shadow Thinking 解析、行為日誌、排程決策)
├── Scheduler.gs       # 排程管理器 (動態管理 GAS Triggers)
├── Tools.gs           # 工具定義與執行邏輯 (整合版)
├── HistoryManager.gs  # 對話歷史管理 (含 Token 瘦身過濾邏輯)
├── GeminiService.gs   # Gemini API 通訊層
├── GoogleSheet.gs     # 資料庫 ORM 層 (讀寫 Sheets)
├── GoogleCalendar.gs  # 日曆串接
├── Line.gs            # LINE Messaging API 封裝
└── Utils.gs           # 通用工具
```

---

## ⚙️ 環境變數設定 (Script Properties)

請在 Google Apps Script 專案設定中新增以下屬性：

| 變數名稱 | 說明 |
|---------|------|
| `LINE_API_KEY` | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `SHEET_ID` | Google Spreadsheet ID |
| `GOOGLE_API_KEY` | Google Cloud API Key (用於 Gemini & Custom Search) |
| `GOOGLE_SEARCH_CX` | Google Custom Search Engine ID |
| `ADMIN_STRING` | 主人管理員的 LINE User ID |

---

## 📊 資料庫 (Google Sheets) Schema

系統會自動檢查並建立所需的工作表，無需手動新增：

| 工作表名稱 | 用途 | 關鍵欄位 | 自動建立 |
|-----------|------|---------|:---:|
| `chat` | 對話歷史 | `userId`, `role`, `content`, `timestamp` | ✅ |
| `knowledge` | 長期事實 | `tags`, `content`, `created_at` | ✅ |
| `short_term_memory` | 短期提醒 | `key`, `content`, `expire_at` | ✅ |
| `todo` | 待辦清單 | `task`, `status`, `created_at` | ✅ |
| `user_matrix` | 狀態矩陣 | `userId`, `mood`, `energy`, `busyness` | ✅ |
| `behavior_log` | 行為日誌 | `userId`, `action`, `context`, `timestamp` | ✅ |
| `env` | 動態開關 | `key`, `value` (e.g. DEBUG_MODE) | ❌ |

---

## 🚀 部署與維護

### 部署指令
```powershell
clasp push
clasp deploy
```

### 定時任務 (Triggers)
**重要**：因為導入了動態排程，請務必手動執行一次 `setupAllTriggers()` 以重置系統：

1. 開啟 `Main.gs`
2. 執行 `setupAllTriggers()`

執行後系統將自動設定：
- **動態觸發 (Dynamic)**：由 AI 決定，名稱為 `onWakeUp`。
- **每日 08:00 (Failsafe)**：`onWakeUp` (防止 AI 睡過頭的保底喚醒)。
- **每 6 小時**：`performMaintenanceTasks` (行為分析與記憶整理)。
- **每日 04:00**：`dailyMemoryCleanUp` (資料庫瘦身)。

---

## 💡 開發筆記
- **Gemini 2.0 Flash**: 目前使用的模型，支援強大的 Multimodal 與 Native Function Calling。
- **Input Token 優化**: 歷史紀錄會自動過濾掉 AI 的 `analysis` JSON，僅保留對話內容，大幅節省成本。
- **JSON 容錯機制**: 內建 Regex Fallback 機制，能處理 Gemini 偶爾輸出的非標準 JSON (Bad Control Characters)。
