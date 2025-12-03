# Christina LINE Bot

一個可愛的貓娘 LINE Bot，支援多輪對話記憶和各種實用功能。

## ✨ 特色功能

- 🤖 **Gemini AI 對話** - 使用 Google Gemini 1.5 Flash，免費額度高
- 💭 **持久化記憶** - 每個用戶獨立的對話歷史（最近 20 輪）
- 🎯 **智能指令系統** - 豐富的指令功能
- 📊 **資料管理** - 待辦事項、資產記錄等

## 📁 專案結構

```
christina/
├── Config.gs          # 設定檔（環境變數、API 配置）
├── Utils.gs           # 工具函數
├── DB.gs              # Google Sheets ORM
├── GoogleDrive.gs     # Drive 檔案操作（含快取）
├── GoogleSheet.gs     # Sheets 資料操作
├── ChatBot.gs         # Gemini AI 整合
├── Line.gs            # LINE Bot API
├── Christina.gs       # 指令系統核心
└── Main.gs            # 主程式入口
```

## 🚀 快速開始

### 方案 A：使用 clasp（推薦）

```powershell
# 1. 安裝 nvm 和 Node.js
nvm install lts
nvm use

# 2. 安裝 clasp
npm install -g @google/clasp

# 3. 登入並推送
clasp login
clasp create --title "Christina Bot" --type standalone
clasp push
clasp open
```

### 方案 B：手動部署

1. 前往 [Google Apps Script](https://script.google.com/)
2. 建立新專案
3. 複製所有 `.gs` 檔案內容

## ⚙️ 環境變數設定

在 Google Apps Script 專案設定中新增：

| 變數名稱 | 說明 | 取得方式 |
|---------|------|---------|
| `LINE_API_KEY` | LINE Channel Token | [LINE Developers](https://developers.line.biz/) |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | 同上 |
| `SHEET_ID` | Google Sheets ID | 從 Sheets URL 複製 |
| `GEMINI_API_KEY` | Gemini API Key | [AI Studio](https://aistudio.google.com/app/apikey) |
| `ADMIN_SATRING` | 管理員 LINE User ID | 用 `myid` 指令取得 |

### 取得 Gemini API Key

1. 訪問 https://aistudio.google.com/app/apikey
2. 點選「Create API key」
3. 選擇專案或建立新專案
4. 複製 API Key

## 📊 Google Sheets 設定

建立一個 Google Sheets，包含以下工作表：

| 工作表名稱 | 欄位 | 說明 |
|-----------|------|------|
| `christina` | status | Bot 開關狀態 |
| `consolelog` | (自動) | 日誌記錄 |
| `eat_what` | (自訂) | 吃什麼選項 |
| `money` | money, date | 資產記錄 |
| `todo` | content, do | 待辦事項 |
| `chat` | userId, role, content, timestamp | 對話歷史 |

**重要：** `chat` 表必須包含 4 個欄位：
```
| userId | role | content | timestamp |
```

## 🎯 指令列表

### 基本指令（所有人）
- `christina` / `安安` - 指令面板
- `command` - 指令列表
- `myid` - 顯示你的 LINE ID
- `roll` - 擲骰子

### 主人專屬
- `meme [名稱]` - 梗圖
- `eat` - 隨機決定吃什麼
- `money` - 顯示資產
- `insertmoney [金額]` - 登錄資產
- `todo [事項]` - 新增待辦
- `todolist` - 待辦列表
- `do [事項]` - 完成事項
- `initchat` - 清除對話記憶
- `start` / `end` - 上班/下班

### AI 對話
直接發送訊息即可與 Christina 聊天（僅主人）

## 🔧 進階設定

### 調整對話記憶

在 `Config.gs` 中：

```javascript
CHAT_MAX_TURNS: 20,        // 保留最近幾輪對話
CHAT_CLEANUP_DAYS: 30,     // 自動清理幾天前的對話
GEMINI_MODEL: 'gemini-1.5-flash',  // 或 'gemini-1.5-pro'
```

### 定時任務

在 GAS 觸發條件中設定：

- `takeBreak()` - 提醒休息
- `recordAssets()` - 提醒記帳
- `removeChat()` - 清理舊對話

## 🐛 除錯

查看 Google Sheets 的 `consolelog` 工作表。

## 📝 開發工作流

```powershell
# 本地編輯
code .

# 推送到 GAS
clasp push

# 監看變更（自動推送）
clasp push --watch

# 開啟 GAS 編輯器
clasp open
```

## 🎉 優化亮點

- ✅ 模組化架構（9 個獨立模組）
- ✅ Gemini AI（免費額度高）
- ✅ 持久化對話記憶（按用戶分離）
- ✅ 指令查找優化（O(1) 複雜度）
- ✅ Drive 檔案快取（6 小時）
- ✅ Webhook 簽章驗證
- ✅ 完整錯誤處理

---

Made with ❤️ by Christina～喵❤️
