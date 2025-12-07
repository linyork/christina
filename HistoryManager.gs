/**
 * HistoryManager
 * @description 管理使用者的對話歷史紀錄
 */
var HistoryManager = (() => {
    var manager = {};

    /**
     * 取得用戶的對話歷史
     * @param {string} userId - 用戶 ID
     * @param {number} limit - 最多保留幾輪對話
     * @returns {array} 對話歷史陣列 (Gemini 格式)
     */
    manager.getUserHistory = (userId, limit) => {
        try {
            limit = limit || Config.CHAT_MAX_TURNS;
            var maxRecords = limit * 2;

            var history = DB()
                .from('chat')
                .limitLoad(Config.CHAT_READ_LIMIT)
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!history || history.length === 0) {
                return [];
            }

            var historyArray = Array.isArray(history) ? history : [history];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            if (historyArray.length > maxRecords) {
                historyArray = historyArray.slice(-maxRecords);
            }

            var contents = [];
            historyArray.forEach(item => {
                if (item.role && item.content) {
                    var role = item.role === 'assistant' ? 'model' : 'user';

                    // [Time Awareness]
                    var timeStr = "";
                    if (item.timestamp) {
                        try {
                            var date = new Date(item.timestamp);
                            if (!isNaN(date.getTime())) {
                                timeStr = "[" + Utilities.formatDate(date, "GMT+8", "yyyy/MM/dd HH:mm:ss") + "] ";
                            }
                        } catch (e) { }
                    }

                    // [Optimization] Strip 'analysis' JSON to save tokens
                    var finalContent = item.content;
                    if (role === 'model') { // Only model responses contain JSON analysis
                        try {
                            // Simple heuristic to check if it looks like JSON
                            if (finalContent.trim().startsWith('{')) {
                                var json = JSON.parse(finalContent);
                                if (json.reply) {
                                    finalContent = json.reply;
                                }
                            }
                        } catch (e) {
                            // Not valid JSON, treat as normal text
                        }
                    }

                    contents.push({
                        "role": role,
                        "parts": [{ "text": timeStr + finalContent }]
                    });
                }
            });

            return contents;
        } catch (ex) {
            GoogleSheet.logError('HistoryManager.getUserHistory', ex);
            return [];
        }
    };

    /**
     * 儲存訊息
     */
    manager.saveMessage = (userId, role, content) => {
        try {
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            DB()
                .insert('chat')
                .set('userId', userId)
                .set('role', role)
                .set('content', content)
                .set('timestamp', timestamp)
                .execute();

        } catch (ex) {
            GoogleSheet.logError('HistoryManager.saveMessage', ex);
        }
    };

    /**
     * 清理舊對話
     */
    manager.cleanOldHistory = (userId, keepTurns) => {
        try {
            keepTurns = keepTurns || Config.CHAT_MAX_TURNS;
            var keepRecords = keepTurns * 2;

            var allHistory = DB()
                .from('chat')
                .limitLoad(Config.CHAT_READ_LIMIT)
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!allHistory || allHistory.length <= keepRecords) {
                return;
            }

            var historyArray = Array.isArray(allHistory) ? allHistory : [allHistory];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            var deleteCount = historyArray.length - keepRecords;

            if (deleteCount > 0) {
                // 計算截止時間：刪除早於第 deleteCount 筆記錄的所有訊息
                // 注意：這裡假設 Timestamp 不重複且單調遞增，若有重複可能會少刪一點，但在對話紀錄場景可接受。

                var cutoffRecord = historyArray[deleteCount];
                if (cutoffRecord && cutoffRecord.timestamp) {
                    var cutoffTime = cutoffRecord.timestamp;

                    DB().deleteRows('chat')
                        .where('userId', '=', userId)
                        .where('timestamp', '<', cutoffTime)
                        .execute();

                    GoogleSheet.logInfo('HistoryManager.cleanOldHistory', 'Cleaned old messages before ' + cutoffTime);
                }
            }

        } catch (ex) {
            GoogleSheet.logError('HistoryManager.cleanOldHistory', ex);
        }
    };

    manager.clearUserHistory = (userId) => {
        try {
            GoogleSheet.clearChatHistory(userId);
        } catch (ex) {
            GoogleSheet.logError('HistoryManager.clearUserHistory', ex);
        }
    };

    return manager;
})();
