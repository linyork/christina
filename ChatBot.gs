/**
 * ChatBot
 * @description Gemini AI 整合模組 - 支援 Function Calling 與 RAG
 */
var ChatBot = (() => {
    var chatBot = {};

    /**
     * 取得用戶的對話歷史
     * @param {string} userId - 用戶 ID
     * @param {number} limit - 最多保留幾輪對話（預設 20 輪 = 40 條記錄）
     * @returns {array} 對話歷史陣列
     */
    var getUserHistory = (userId, limit) => {
        try {
            limit = limit || Config.CHAT_MAX_TURNS;
            var maxRecords = limit * 2; // 1 輪 = user + assistant 兩條記錄

            // 從 Sheet 讀取該用戶的歷史（按時間倒序）
            var history = DB()
                .from('chat')
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!history || history.length === 0) {
                return [];
            }

            // 轉換為陣列並排序（最舊的在前）
            var historyArray = Array.isArray(history) ? history : [history];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            // 只保留最近的 N 條記錄
            if (historyArray.length > maxRecords) {
                historyArray = historyArray.slice(-maxRecords);
            }

            // 轉換為 Gemini API 格式
            var contents = [];
            historyArray.forEach(item => {
                if (item.role && item.content) {
                    // Gemini 使用 'user' 和 'model' 作為角色
                    var role = item.role === 'assistant' ? 'model' : 'user';
                    contents.push({
                        "role": role,
                        "parts": [{ "text": item.content }]
                    });
                }
            });

            return contents;
        } catch (ex) {
            GoogleSheet.logError('ChatBot.getUserHistory', ex);
            return [];
        }
    };

    /**
     * 儲存訊息到對話歷史
     * @param {string} userId - 用戶 ID
     * @param {string} role - 角色（user/assistant）
     * @param {string} content - 訊息內容
     */
    var saveMessage = (userId, role, content) => {
        try {
            // 轉換為台灣時間格式 (YYYY/MM/DD HH:mm:ss)
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            GoogleSheet.logInfo('ChatBot.saveMessage', 'Saving: userId=' + userId + ', role=' + role);

            DB()
                .insert('chat')
                .set('userId', userId)
                .set('role', role)
                .set('content', content)
                .set('timestamp', timestamp)
                .execute();

            GoogleSheet.logInfo('ChatBot.saveMessage', 'Saved successfully');
        } catch (ex) {
            GoogleSheet.logError('ChatBot.saveMessage', 'Error details:', ex.toString(), 'userId=' + userId, 'role=' + role);
        }
    };

    /**
     * 清理用戶的舊對話（保留最近 N 輪）
     * @param {string} userId - 用戶 ID
     * @param {number} keepTurns - 保留幾輪對話
     */
    var cleanOldHistory = (userId, keepTurns) => {
        try {
            keepTurns = keepTurns || Config.CHAT_MAX_TURNS;
            var keepRecords = keepTurns * 2;

            // 取得該用戶的所有對話
            var allHistory = DB()
                .from('chat')
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!allHistory || allHistory.length <= keepRecords) {
                return; // 不需要清理
            }

            // 轉換為陣列並排序
            var historyArray = Array.isArray(allHistory) ? allHistory : [allHistory];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            // 計算要刪除的記錄數量
            var deleteCount = historyArray.length - keepRecords;
            if (deleteCount > 0) {
                GoogleSheet.logInfo('ChatBot.cleanOldHistory', 'Cleaned ' + deleteCount + ' old messages for user ' + userId);
            }
        } catch (ex) {
            GoogleSheet.logError('ChatBot.cleanOldHistory', ex);
        }
    };

    /**
     * 清除用戶的所有對話歷史
     * @param {string} userId - 用戶 ID
     */
    chatBot.clearUserHistory = (userId) => {
        try {
            GoogleSheet.clearChatHistory(userId);
            GoogleSheet.logInfo('ChatBot.clearUserHistory', 'Cleared history for user ' + userId);
        } catch (ex) {
            GoogleSheet.logError('ChatBot.clearUserHistory', ex);
        }
    };

    /**
     * 呼叫 Gemini API（支援 Function Calling）
     * @param {array} contents - 對話內容
     * @param {array} tools - 工具定義（可選）
     * @returns {object} API 回應
     */
    var callGemini = (contents, tools) => {
        try {
            var url = Config.GEMINI_API_BASE + '/models/' + Config.GEMINI_MODEL + ':generateContent?key=' + Config.GEMINI_API_KEY;

            var payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 2048,
                    "topP": 0.95
                }
            };

            // 如果有提供工具定義，加入 payload
            if (tools && tools.length > 0) {
                payload.tools = [{
                    "functionDeclarations": tools
                }];
                GoogleSheet.logInfo('ChatBot.callGemini', 'Tools attached count:', tools.length);
            }

            var options = {
                "method": "post",
                "contentType": "application/json",
                "payload": JSON.stringify(payload),
                "muteHttpExceptions": true
            };

            var response = UrlFetchApp.fetch(url, options);
            var responseCode = response.getResponseCode();

            if (responseCode !== 200) {
                GoogleSheet.logError('ChatBot.callGemini', 'API Error: ' + responseCode, response.getContentText());
                return null;
            }

            var responseText = response.getContentText();
            // GoogleSheet.logInfo('ChatBot.callGemini', 'Raw Response:', responseText); // 除錯用，確認回應結構

            return JSON.parse(responseText);
        } catch (error) {
            GoogleSheet.logError('ChatBot.callGemini', error);
            return null;
        }
    };

    /**
     * 回覆訊息（支援 Function Calling 與 RAG）
     * @param {string} userId - 用戶 ID
     * @param {string} message - 使用者訊息
     * @returns {string} AI 回覆
     */
    chatBot.reply = (userId, message) => {
        try {
            // 取得該用戶的對話歷史
            var userHistory = getUserHistory(userId, Config.CHAT_MAX_TURNS);

            // 建立完整的對話內容
            var contents = [];

            // 加入系統提示（作為第一條 user 訊息）
            contents.push({
                "role": "user",
                "parts": [{ "text": Config.CHAT_SYSTEM_PROMPT }]
            });
            contents.push({
                "role": "model",
                "parts": [{ "text": "好的，我是 Christina～喵❤️ 我會盡量使用工具來協助主人！" }]
            });

            // 加入歷史對話
            contents = contents.concat(userHistory);

            // 加入當前訊息
            contents.push({
                "role": "user",
                "parts": [{ "text": message }]
            });

            // 取得工具定義
            var toolDefinitions = Tools.getDefinitions();

            // 多輪對話迴圈（最多 5 輪，避免無限迴圈）
            var maxTurns = 5;
            var finalResponse = '';

            for (var turn = 0; turn < maxTurns; turn++) {
                // 呼叫 Gemini API
                var data = callGemini(contents, toolDefinitions);

                if (!data || !data.candidates || !data.candidates[0]) {
                    GoogleSheet.logError('ChatBot.reply', 'Invalid response format', data);
                    return '主人不好意思我有點混亂～喵💔';
                }

                var candidate = data.candidates[0];
                var content = candidate.content;

                if (!content || !content.parts || content.parts.length === 0) {
                    GoogleSheet.logError('ChatBot.reply', 'No content in response');
                    return '主人不好意思我有點混亂～喵💔';
                }

                var part = content.parts[0];

                // 檢查是否為 Function Call
                if (part.functionCall) {
                    var functionCall = part.functionCall;
                    var functionName = functionCall.name;
                    var functionArgs = functionCall.args || {};

                    GoogleSheet.logInfo('ChatBot.reply', 'Function call: ' + functionName);

                    // 執行工具
                    var functionResult = Tools.execute(functionName, functionArgs);

                    // 將工具執行結果加入對話
                    contents.push({
                        "role": "model",
                        "parts": [{ "functionCall": functionCall }]
                    });
                    contents.push({
                        "role": "user",
                        "parts": [{
                            "functionResponse": {
                                "name": functionName,
                                "response": {
                                    "result": functionResult
                                }
                            }
                        }]
                    });

                    // 繼續下一輪，讓 AI 根據工具結果生成回應
                    continue;
                }

                // 如果是文字回應，結束迴圈
                if (part.text) {
                    finalResponse = part.text;
                    break;
                }

                // 其他情況，結束迴圈
                GoogleSheet.logError('ChatBot.reply', 'Unexpected response type', part);
                break;
            }

            if (!finalResponse) {
                return '主人不好意思我有點混亂～喵💔';
            }

            // 儲存對話
            saveMessage(userId, 'user', message);
            saveMessage(userId, 'assistant', finalResponse);

            // 清理舊對話（保持在限制內）
            cleanOldHistory(userId, Config.CHAT_MAX_TURNS);

            return finalResponse;
        } catch (error) {
            GoogleSheet.logError('ChatBot.reply', error);
            return '主人不好意思我有點混亂～喵💔';
        }
    };

    return chatBot;
})();
