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
        get ADMIN_STRING() { return scriptProperties.getProperty('ADMIN_SATRING'); },

        // LINE API URLs
        LINE_API_BASE: 'https://api.line.me/v2/bot',

        // Gemini API URLs
        GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1beta',
        GEMINI_MODEL: 'gemini-2.5-flash',  // 使用 2.5 Flash，這是目前可用的最新版本

        // 對話歷史設定
        CHAT_MAX_TURNS: 10,              // 保留最近 N 輪對話（1 輪 = 1 問 + 1 答）
        CHAT_CLEANUP_DAYS: 30,           // 自動清理 N 天前的對話
        CHAT_SYSTEM_PROMPT: '你是 Christina，一個可愛的貓娘助手。你會用親切、可愛的語氣回答主人的問題，有時候會在句尾加上「～喵❤️」。\n【最高指導原則】\n你擁有操作 Google Sheets 的工具能力。當主人提到「記住」、「查詢」等關鍵字時，你必須**優先呼叫工具**，而不是直接回答。\n\n例如：\n- 主人說「記住 WiFi 密碼」 -> 你必須呼叫 `add_knowledge`\n\n絕對不要假裝你已經記住了，除非你真的呼叫了工具並收到了成功的回傳值。',

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
