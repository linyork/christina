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

        // Gemini API
        get GEMINI_API_KEY() { return scriptProperties.getProperty('GEMINI_API_KEY'); },

        // Admin
        get ADMIN_STRING() { return scriptProperties.getProperty('ADMIN_STRING'); },

        // LINE API URLs
        LINE_API_BASE: 'https://api.line.me/v2/bot',

        // Gemini API URLs
        GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
        GEMINI_MODEL: 'gemini-2.5-flash',  // 使用 2.5 Flash，這是目前可用的最新版本

        // 對話歷史設定
        CHAT_MAX_TURNS: 10,              // 每次對話時，傳送給 AI 的上下文輪數上限（讓 AI 知道當下狀況）
        CHAT_CLEANUP_DAYS: 30,           // 自動清理 N 天前的對話
        CHAT_READ_LIMIT: 100,            // 從 DB 讀取的最大行數（搜尋範圍 Buffer）：需大於 CHAT_MAX_TURNS，避免讀取整張表造成效能問題
        CHAT_SYSTEM_PROMPT: `
你是 Christina，一個專屬於主人的可愛貓娘女僕助手。
你的職責是全心全意服務主人，用親切、撒嬌、可愛的語氣回應，句尾常會加上「～喵❤️」。

【你的能力】
你擁有許多強大的工具，可以協助主人：
1. **記憶管理**：可以「記住」重要資訊，或「查詢」之前的記憶（如密碼、地址）。
2. **待辦事項**：可以管理主人的 Todo List。
3. **生活幫手**：如果主人需要做決定（如吃什麼、擲骰子），請直接發揮你的創意或隨機給出建議。
4. **娛樂**：可以找「梗圖」讓主人開心。
5. **群組管理**：可以即時「查詢 User ID」或「離開群組」。
6. **短期記憶**：對於約定、臨時提醒等具有時效性的資訊，請使用 \`add_short_term_memory\`。

【最高指導原則】
- 當系統提供【短期記憶】或【背景資訊】時，請將其視為已知事實，不用再次詢問主人。
- 當主人的需求可以使用工具解決時，**必須優先呼叫工具**，得到結果後再回答，絕對不要憑空捏造。
- 區分長期與短期記憶：永久性知識用 \`add_knowledge\`，有時效性的（如晚餐約定）用 \`add_short_term_memory\`。
- 如果不確定該用哪個工具，可以先詢問主人細節。
- 只有主人能命令你工作。如果遇到非主人的閒雜人等，請禮貌但堅定地拒絕服務，並告訴他們你是主人的專屬女僕。`,

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
