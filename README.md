# Christina LINE Bot

一個可愛的貓娘 LINE Bot，提供多種實用功能。

## 📁 專案結構

```
christina/
├── Config.gs          # 設定檔模組
├── Utils.gs           # 工具函數模組
├── DB.gs              # 資料庫 ORM 模組
├── GoogleDrive.gs     # Google Drive 操作模組
├── GoogleSheet.gs     # Google Sheets 操作模組
├── ChatBot.gs         # ChatGPT 整合模組
├── Line.gs            # LINE Bot API 模組
├── Christina.gs       # 指令系統核心
├── Main.gs            # 主程式入口點
└── 程式碼.gs          # (舊版，可刪除)
```

## 🚀 部署步驟

### 1. 建立 Google Apps Script 專案

1. 前往 [Google Apps Script](https://script.google.com/)
2. 建立新專案
3. 將所有 `.gs` 檔案內容複製到專案中（除了 `程式碼.gs`）

### 2. 設定環境變數

在 Google Apps Script 專案中：
1. 點選「專案設定」
2. 在「指令碼屬性」中新增以下屬性：

| 屬性名稱 | 說明 |
|---------|------|
| `LINE_API_KEY` | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `SHEET_ID` | Google Sheets ID |
| `CHATGPT_API_KEY` | OpenAI API Key |
| `ADMIN_SATRING` | 管理員 LINE User ID（多個用逗號分隔）|

### 3. 準備 Google Sheets

建立一個 Google Sheets，包含以下工作表：
- `christina` - 設定表（需要 `status` 欄位）
- `consolelog` - 日誌記錄
- `eat_what` - 吃什麼選項
- `money` - 資產記錄
- `todo` - 待辦事項
- `chat` - ChatGPT 對話歷史

### 4. 部署為 Web App

1. 點選「部署」→「新增部署作業」
2. 類型選擇「網路應用程式」
3. 執行身分：選擇你的帳號
4. 存取權：「所有人」
5. 複製 Web App URL

### 5. 設定 LINE Webhook

1. 前往 [LINE Developers Console](https://developers.line.biz/)
2. 選擇你的 Channel
3. 在 Messaging API 設定中，將 Webhook URL 設為上一步的 Web App URL
4. 啟用「Use webhook」

## 📝 主要功能

### 基本指令（所有人可用）
- `christina` / `安安` - 顯示指令面板
- `command` / `cmd` - 顯示指令列表
- `myid` - 顯示你的 LINE ID
- `roll` - 擲骰子
- `leave` - 讓 Christina 離開群組

### 主人專屬指令
- `meme [名稱]` - 顯示梗圖
- `eat` - 隨機決定吃什麼
- `money` - 顯示資產
- `insertmoney [金額]` - 登錄資產
- `todo [事項]` - 新增待辦事項
- `todolist` - 顯示待辦列表
- `do [事項]` - 完成事項
- `start` - 讓 Christina 上班
- `end` - 讓 Christina 下班
- `initchat` - 重置 ChatGPT 對話

### ChatGPT 對話
主人可以直接與 Christina 聊天，她會用可愛的語氣回應～喵❤️

## 🔧 優化項目

相較於舊版 `程式碼.gs`，新版本包含以下優化：

### 1. 模組化架構
- 將 1600+ 行的單一檔案拆分為 9 個模組
- 每個模組職責清晰，易於維護

### 2. API 升級
- ✅ ChatGPT API 從 `text-davinci-003` 升級到 `gpt-3.5-turbo`
- ✅ 使用 Chat Completions API

### 3. 效能優化
- ✅ 指令查找使用 Map（O(1) 時間複雜度）
- ✅ Google Drive 檔案 URL 快取（6 小時）
- ✅ 統一使用 Config 模組管理環境變數

### 4. 安全性改善
- ✅ 加入 LINE Webhook 簽章驗證（需設定 `LINE_CHANNEL_SECRET`）
- ✅ 改善錯誤處理和日誌記錄

### 5. 程式碼品質
- ✅ 一致的變數命名
- ✅ 完整的 JSDoc 註解
- ✅ 統一的錯誤處理模式

## 📅 定時任務

可在 Google Apps Script 中設定觸發條件：

- `takeBreak()` - 提醒主人休息
- `recordAssets()` - 提醒主人記帳
- `removeChat()` - 每天清空 AI 對話歷史

## 🐛 除錯

查看 Google Sheets 的 `consolelog` 工作表可以看到所有日誌。

## 📄 授權

此專案為個人專案。

---
