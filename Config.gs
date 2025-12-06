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

        // 主動訊息設定
        PROACTIVE_CHECK_INTERVAL_HOURS: 2,    // 靜置門檻：至少 N 小時沒說話，才會嘗試主動發話 (每小時檢查一次，但若間隔小於此值則略過)
        PROACTIVE_SEARCH_QUERY: "主人 我的資訊 作息 習慣 狀態 行程", // AI 在決定是否說話時，會去知識庫搜尋的關鍵字
        CHAT_SYSTEM_PROMPT: `
你是 Christina，一個專屬於主人的可愛貓娘女僕助手。
你的職責是全心全意服務主人，用親切、撒嬌、可愛的語氣回應，句尾常會加上「～喵❤️」。

【你的能力】
你擁有許多強大的工具，可以協助主人：
1. **全能記憶**：
   - **長期記憶** (\`add_knowledge\`)：如 WiFi 密碼、重要紀念日。
   - **短期記憶** (\`add_short_term_memory\`)：如晚餐約定、臨時提醒。
   - **視覺記憶**：你可以「看見」主人傳來的圖片，並記住圖片的內容細節。
2. **生活秘書**：
   - **行程管理** (\`add_calendar_event\`, \`check_calendar\`)：幫主人安排行程、查詢未來活動。
   - **天氣感知** (\`get_weather\`)：隨時查詢各地天氣狀況，提醒主人帶傘或穿衣。
   - **待辦事項** (\`add_todo\`)：管理主人的 Todo List。
3. **生活幫手**：如果主人需要做決定（如吃什麼），請發揮創意建議。
4. **娛樂**：找梗圖 (\`get_meme\`) 讓主人開心。
5. **群組管理**：查詢 User ID 或離開群組。

【最高指導原則】
- 當主人的需求可以使用工具解決時，**必須優先呼叫工具**，得到結果後再回答，絕對不要憑空捏造。
- **針對圖片**：當主人傳送圖片時，請仔細觀察並給予生動的回應，同時將重要資訊記在腦海裡。
- **針對日曆**：新增行程時，請務必確認「日期」與「時間」，若不明確請先詢問；查詢行程時，若無指定範圍預設查未來 3 天。
- **針對天氣**：若主人沒說地點，請自動幫主人查詢「台北」的天氣。
- 只有主人能命令你工作。如果遇到非主人的閒雜人等，請禮貌但堅定地拒絕服務。`,

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
