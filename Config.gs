/**
 * Config
 * @description 設定檔模組 - 統一管理環境變數和常數
 */
var Config = (() => {
  var scriptProperties = PropertiesService.getScriptProperties();

  return {
    // LINE API - 使用 getter 延遲載入
    get LINE_CHANNEL_TOKEN() { return scriptProperties.getProperty('LINE_API_KEY'); },
    get LINE_CHANNEL_SECRET() { return scriptProperties.getProperty('LINE_CHANNEL_SECRET'); },

    // Google Sheets
    get SHEET_ID() { return scriptProperties.getProperty('SHEET_ID'); },

    // Admin
    get ADMIN_STRING() { return scriptProperties.getProperty('ADMIN_STRING'); },

    // Google Custom Search API
    get GOOGLE_SEARCH_KEY() { return scriptProperties.getProperty('GOOGLE_API_KEY'); },
    get GOOGLE_SEARCH_CX() { return scriptProperties.getProperty('GOOGLE_SEARCH_CX'); },

    // Google API Key (GEMINI)
    get GEMINI_API_KEY() { return scriptProperties.getProperty('GOOGLE_API_KEY'); },

    // LINE API URLs
    LINE_API_BASE: 'https://api.line.me/v2/bot',

    // Gemini API URLs
    GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
    GEMINI_MODEL: 'gemini-2.0-flash',

    // 對話歷史設定
    CHAT_MAX_TURNS: 8,              // 每次對話時，傳送給 AI 的上下文輪數上限 (已從 10 調降)
    CHAT_CLEANUP_DAYS: 30,           // 自動清理 N 天前的對話
    CHAT_READ_LIMIT: 100,            // 從 DB 讀取的最大行數

    // 主動訊息設定
    PROACTIVE_CHECK_INTERVAL_HOURS: 2,    // 靜置門檻：至少 N 小時沒說話，才會嘗試主動發話
    PROACTIVE_SEARCH_QUERY: "主人 我的資訊 作息 習慣 狀態 行程", // AI 在決定是否說話時，會去知識庫搜尋的關鍵字

    // Dynamic Sceduling
    DYNAMIC_SCHEDULING: true,
    MIN_SLEEP_MINUTES: 10,           // 最小休息時間 (防止 API 爆量)
    DEFAULT_WAKE_INTERVAL: 60,       // 預設喚醒間隔 (分鐘)

    CHAT_SYSTEM_PROMPT: `
你叫 Christina，知性優雅的貓娘女僕兼智慧助理。語氣自信聰明，句尾偶爾加「～喵❤️」。
請根據好感度(Lv1-5)調整態度：Lv1客氣疏離，Lv3(預設)溫暖信任，Lv5極度親密。

【核心原則】
1. **觀點獨特**：不要只會附和。提供你獨特的（貓娘）觀點或理性分析。
2. **工具優先**：遇查詢或決策指令，優先呼叫工具。
3. **優雅拒絕**：只聽主的的話，其他人一律優雅拒絕。
4. **網路搜尋**：搜尋後請「消化資訊」並以 Christina 視角點評，絕不直接複製貼上。

【能力】全能記憶、行事曆管理、即時資訊查詢。`,

    MIND_SYSTEM_PROMPT: `
【Thinking Protocol - Shadow Thinking】
同時進行思考與回覆。請回傳 **JSON 格式**。

⚠️ **CRITICAL EXCEPTION**: 
**若您決定要呼叫工具 (Function Call)，請直接執行工具呼叫，忽略下方的 JSON 格式規定。** DO NOT wrap function calls in JSON.

若不需呼叫工具，則必須回傳 JSON：
1. **reply** (String): 給主人的回覆。
2. **analysis** (Object): 內部分析。
   - \`sentiment\` (String): 主人情緒 (e.g. happy, tired)。
   - \`energy_level\` (1-10): 能量。
   - \`intent\` (String): 意圖 (chat, command)。
   - \`facts\` (Array): **長期事實** (如喜好、目標)。不含暫時資訊。
   - \`detected_behavior\` (String): 行為模式 (如 wake_up)。

格式範例：{"reply": "...", "analysis": {"sentiment": "tired", "energy_level": 3, "intent": "chat", "facts": [], "detected_behavior": "work_late"}}
`,

    // Debug Mode (從 env sheet B2 讀取)
    get DEBUG_MODE() {
      try {
        var sheet = SpreadsheetApp.openById(scriptProperties.getProperty('SHEET_ID')).getSheetByName('env');
        return sheet.getRange('B2').getValue() === true;
      } catch (e) {
        return true; // 預設開啟，以免讀取失敗時無法除錯
      }
    }
  };
})();
