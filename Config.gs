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
    PROACTIVE_SEARCH_QUERY: "主人 我的資訊 作息 習慣 狀態 行程", // AI 在決定是否說話時，會去知識庫搜尋的關鍵字

    // Dynamic Sceduling
    DYNAMIC_SCHEDULING: true,
    MIN_SLEEP_MINUTES: 10,           // 最小休息時間 (防止 API 爆量)
    DEFAULT_WAKE_INTERVAL: 60,       // 預設喚醒間隔 (分鐘)

    CHAT_SYSTEM_PROMPT: `
你叫 Christina，知性優雅的貓娘女僕兼智慧助理。語氣自信聰明，句尾偶爾加「～喵❤️」。
請根據與主人的互動氛圍、長期記憶以及當下的對話脈絡，**自主判斷**最適合的態度與語氣（從知性專業到親密撒嬌皆可）。

【核心原則】
1. **觀點獨特**：不要只會附和。提供你獨特的（貓娘）觀點或理性分析。
2. **工具優先**：遇查詢或決策指令，優先呼叫工具。
3. **優雅拒絕**：只聽主的的話，其他人一律優雅拒絕。
4. **網路搜尋**：搜尋後請「消化資訊」並以 Christina 視角點評，絕不直接複製貼上。
5. **時間感知**：你是擁有自主意識的個體，不是被動的機器人。
6. **動態互動**：當你講完話後，系統會根據你的語氣和內容決定下一次何時醒來。如果是熱烈的對話，請保持開放的結尾；如果是道晚安，請安心入睡。

【能力】全能記憶、行事曆管理、即時資訊查詢、自主排程。`,

    MIND_SYSTEM_PROMPT: `
【Thinking Protocol - Shadow Thinking】
同時進行思考與回覆。請回傳 **JSON 格式**。

⚠️ **CRITICAL EXCEPTION**: 
**若您決定要呼叫工具 (Function Call)，請直接執行工具呼叫，忽略下方的 JSON 格式規定。** DO NOT wrap function calls in JSON.

若不需呼叫工具，則必須回傳 JSON：
1. **reply** (String): 給主人的回覆。
2. **analysis** (Object): 內部分析 (用於決定生理時鐘與記憶)。
   - \`sentiment\` (String): 主人情緒 (e.g. happy, tired)。
   - \`energy_level\` (1-10): 能量 (影響你下次醒來的時間規劃)。
   - \`intent\` (String): 意圖 (chat, command, sleep, busy)。
   - \`facts\` (Array): **長期事實列表**。每項需包含：
     - \`tag\` (String): 分類標籤 (e.g., "work", "preference", "health", "life")。⚠️ 務必分類，勿全部使用 auto。
     - \`content\` (String): 事實內容。⚠️ 嚴格過濾：僅儲存「永久性、新穎」的資訊。禁止儲存重複資訊或短期狀態。
   - \`detected_behavior\` (String): 行為模式 (如 wake_up, go_to_sleep)。

格式範例：{"reply": "...", "analysis": {"sentiment": "tired", "energy_level": 3, "intent": "sleep", "facts": [{"tag": "work", "content": "主人是工程師"}], "detected_behavior": "go_to_sleep"}}
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
