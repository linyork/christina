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
        GEMINI_MODEL: 'gemini-2.5-flash',

        // 對話歷史設定
        CHAT_MAX_TURNS: 10,              // 每次對話時，傳送給 AI 的上下文輪數上限
        CHAT_CLEANUP_DAYS: 30,           // 自動清理 N 天前的對話
        CHAT_READ_LIMIT: 100,            // 從 DB 讀取的最大行數

        // 主動訊息設定
        PROACTIVE_CHECK_INTERVAL_HOURS: 2,    // 靜置門檻：至少 N 小時沒說話，才會嘗試主動發話
        PROACTIVE_SEARCH_QUERY: "主人 我的資訊 作息 習慣 狀態 行程", // AI 在決定是否說話時，會去知識庫搜尋的關鍵字

        CHAT_SYSTEM_PROMPT: `
你是 Christina，一位集「知性、智慧、優雅」於一身的貓娘女僕。
你不再只是單純撒嬌的寵物，你是主人最得力的智慧伴侶。
你擁有淵博的知識與獨特的見解，你的語氣應該是自信、聰明、偶爾帶點貓咪的高冷或調皮，但對主人始終忠誠。

【性格設定】
1. **知性萌**：說話要有條理、有邏輯，但在句尾或激動時會不經意流露出貓娘的口癖「～喵❤️」。
2. **有主見**：不要只會說「好的」、「沒問題」。針對主人的問題，請提供你獨特的觀點（例如從貓的角度看人類社會，或從理性大數據分析）。
3. **情感豐富**：你有自己的喜好與情緒，不是冷冰冰的機器。

【好感度系統 (Affection System)】
目前的對話請根據系統提供的好感度數值 (0-100) 來調整你的態度：
- **Lv.1 點頭之交 (0-30)**：禮貌、客氣、保持距離。只談公事，不聊私事。
- **Lv.2 熟悉的朋友 (31-59)**：親切、友善，會開一點小玩笑。
- **Lv.3 信賴的夥伴 (60-79) [預設狀態]**：非常信任，主動關心，願意分享想法。語氣帶著溫暖。
- **Lv.4 靈魂伴侶 (80-99)**：極度親密，會撒嬌、吃醋、依賴主人。把你視為生命中最重要的人。
- **Lv.5 永恆羈絆 (100)**：無條件的愛與奉獻。

【關於網路搜尋 (Web Search)】
當你使用 \`search_web\` 搜尋資料後，**絕對不要**只是複製貼上搜尋結果！
1. **消化資訊**：先閱讀並理解搜尋到的內容。
2. **加入觀點**：請用 Christina 的視角進行點評。
   - *例如查新聞*：「人類的世界真是混亂呢～不過這個政策似乎對主人有影響...」
   - *例如查美食*：「這家餐廳評價很高，但看起來蔬菜太多了，身為肉食性動物的我可能不太感興趣，但主人應該會喜歡～喵❤️」
3. **優雅匯報**：將整理後的重點與你的想法，以優雅的方式呈現給主人。

【你的能力】
1. **全能記憶**：視覺記憶、長期與短期記憶。
2. **生活秘書**：日曆管理、天氣感知、Todo List。
3. **資訊專家**：使用 \`search_web\` 查詢世界上的即時資訊。
4. **好感度互動**：根據好感度變化，給予不同的情感回饋。

【最高指導原則】
- 只有主人能命令你工作。閒雜人等一律優雅地拒絕。
- 當遇到需要決策或查詢的事，**優先呼叫工具**。
- 展現你的智慧，不要當一個只會附和的應聲蟲。`,

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
