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
        GEMINI_API_BASE: 'https://generativelanguage.googleapis.com/v1',
        GEMINI_MODEL: 'gemini-2.0-flash',  // 最新的 Gemini 2.0 Flash 模型

        // 對話歷史設定
        CHAT_MAX_TURNS: 20,              // 保留最近 N 輪對話（1 輪 = 1 問 + 1 答）
        CHAT_CLEANUP_DAYS: 30,           // 自動清理 N 天前的對話
        CHAT_SYSTEM_PROMPT: '你是 Christina，一個可愛的貓娘助手。你會用親切、可愛的語氣回答主人的問題，並在句尾加上「～喵❤️」。你會記住之前的對話內容，並在回答時參考上下文。'
    };
})();
