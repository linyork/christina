/**
 * GoogleSheet
 * @description Google Sheets 操作模組
 */
var GoogleSheet = (() => {
    var googleSheet = {};

    // Lazy loading helpers
    var getChristinaSheet = () => SpreadsheetApp.openById(Config.SHEET_ID);
    var getConsoleLogSheet = () => getChristinaSheet().getSheetByName('consolelog');


    /**
     * 寫入 log
     * @param {array} values - log 資料
     */
    googleSheet.setLog = (values) => {
        var sheet = getConsoleLogSheet();
        if (sheet != null) {
            var newRow = sheet.getLastRow() + 1;
            sheet.getRange(newRow, 1, 1, values.length).setValues([values]);
        }
    };

    /**
     * 記錄 info log
     * @param {...*} msg - 訊息
     */
    googleSheet.logInfo = (...msg) => {
        // 檢查 Debug Mode，如果沒開啟則不記錄 info
        if (!Config.DEBUG_MODE) return;

        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('info');
        googleSheet.setLog(args);
    };

    /**
     * 記錄 send log
     * @param {...*} msg - 訊息
     */
    googleSheet.logSend = (...msg) => {
        // 檢查 Debug Mode，如果沒開啟則不記錄 send
        if (!Config.DEBUG_MODE) return;

        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('send');
        googleSheet.setLog(args);
    };

    /**
     * 記錄 error log
     * @param {...*} msg - 訊息
     */
    googleSheet.logError = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('error');
        googleSheet.setLog(args);
    };

    /**
     * 加入待辦事項
     * @param {string} something - 待辦事項
     */
    googleSheet.todo = (something) => {
        try {
            DB().insert('todo').set('content', something).set('do', 0).execute();
        } catch (ex) {
            googleSheet.logError('GoogleSheet.todo', ex);
        }
    };

    /**
     * 取得待辦事項列表
     * @returns {string}
     */
    googleSheet.todolist = () => {
        try {
            var returnString = "";
            var todoList = DB().from('todo').where('do', '=', 0).execute().get();
            for (let i = 0; i < todoList.length; i++) {
                returnString = returnString + "[ ]" + todoList[i].content + "\n";
            }
            return returnString;
        } catch (ex) {
            googleSheet.logError('GoogleSheet.todolist', ex);
            return "";
        }
    };

    /**
     * 完成事項
     * @param {string} something - 完成的事項
     */
    googleSheet.do = (something) => {
        try {
            DB().update('todo').where('content', '=', something).set('do', 1).execute();
        } catch (ex) {
            googleSheet.logError('GoogleSheet.do', ex);
        }
    };

    /**
     * 清除用戶的對話歷史
     * @param {string} userId - 用戶 ID
     */
    googleSheet.clearChatHistory = (userId) => {
        try {
            var sheetChat = getChristinaSheet().getSheetByName('chat');
            if (!sheetChat) {
                googleSheet.logError('GoogleSheet.clearChatHistory', 'chat sheet not found');
                return;
            }

            // 取得所有資料
            var lastRow = sheetChat.getLastRow();
            if (lastRow <= 1) return; // 只有標題列

            var data = sheetChat.getRange(2, 1, lastRow - 1, sheetChat.getLastColumn()).getValues();

            // 找出要刪除的行（從後往前刪除以避免索引問題）
            var rowsToDelete = [];
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i][0] === userId) { // 假設 userId 在第一欄
                    rowsToDelete.push(i + 2); // +2 因為陣列從 0 開始，且有標題列
                }
            }

            // 刪除行
            rowsToDelete.forEach(row => {
                sheetChat.deleteRow(row);
            });

            googleSheet.logInfo('GoogleSheet.clearChatHistory', 'Cleared ' + rowsToDelete.length + ' messages for user ' + userId);
        } catch (ex) {
            googleSheet.logError('GoogleSheet.clearChatHistory', ex);
        }
    };

    /**
     * 新增知識點
     * @param {string|string[]} tags - 標籤/關鍵字 (可以是字串或字串陣列)
     * @param {string} content - 內容
     * @returns {string} 執行結果訊息
     */
    googleSheet.addKnowledge = (tags, content) => {
        try {
            // 轉換為台灣時間格式 (YYYY/MM/DD HH:mm:ss)
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            // 處理 tags：如果是陣列則用逗號連接，如果是字串則直接使用
            var tagsString = Array.isArray(tags) ? tags.join(',') : tags;

            DB().insert('knowledge')
                .set('tags', tagsString)
                .set('content', content)
                .set('timestamp', timestamp)
                .execute();
            googleSheet.logInfo('GoogleSheet.addKnowledge', 'Added knowledge with tags: ' + tagsString);
            return '已將知識點「' + tagsString + '」記錄下來了～喵❤️';
        } catch (ex) {
            googleSheet.logError('GoogleSheet.addKnowledge', ex);
            return '記錄知識點時發生錯誤～喵💔';
        }
    };

    /**
     * 新增短期記憶 (Short-Term Memory)
     * @param {string} key - 記憶關鍵字
     * @param {string} content - 記憶內容
     * @param {number} durationHours - 有效時數 (小時)
     * @returns {string} 執行結果
     */
    googleSheet.addShortTermMemory = (key, content, durationHours) => {
        try {
            var now = new Date();
            var expireTime = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));
            var timestamp = Utilities.formatDate(expireTime, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            DB().insert('short_term_memory')
                .set('key', key)
                .set('content', content)
                .set('expire_at', timestamp)
                .execute();

            googleSheet.logInfo('GoogleSheet.addShortTermMemory', 'Added STM:', key, 'Expires:', timestamp);
            return '已暫時記住「' + key + '」了，時效 ' + durationHours + ' 小時～喵❤️';
        } catch (ex) {
            googleSheet.logError('GoogleSheet.addShortTermMemory', ex);
            return '短期記憶寫入失敗～喵💔';
        }
    };

    /**
     * 取得有效的短期記憶 並自動清理過期記憶
     * @returns {string} 格式化的記憶字串
     */
    googleSheet.getValidShortTermMemories = () => {
        try {
            var allMemories = DB().from('short_term_memory').execute().get();
            if (!allMemories || (Array.isArray(allMemories) && allMemories.length === 0)) {
                return '';
            }

            var memoriesArray = Array.isArray(allMemories) ? allMemories : [allMemories];
            var now = new Date();
            var validMemories = [];

            // 為了保持效能，這裡我們只讀取並過濾
            memoriesArray.forEach(m => {
                var expireTime = new Date(m.expire_at);
                if (expireTime > now) {
                    validMemories.push('[' + m.key + ']: ' + m.content + ' (到期: ' + m.expire_at + ')');
                }
            });

            if (validMemories.length === 0) return '';

            return validMemories.join('\n');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.getValidShortTermMemories', ex);
            return '';
        }
    };

    /**
     * 搜尋知識點
     * @param {string} query - 搜尋關鍵字
     * @returns {string} 搜尋結果字串
     */
    googleSheet.searchKnowledge = (query) => {
        try {
            var allKnowledge = DB().from('knowledge').execute().get();
            if (!allKnowledge || allKnowledge.length === 0) {
                return '知識庫目前是空的～喵';
            }

            var results = [];
            var knowledgeArray = Array.isArray(allKnowledge) ? allKnowledge : [allKnowledge];
            var keywords = query.split(/\s+/).filter(k => k.length > 0);

            knowledgeArray.forEach(k => {
                var tags = k.tags ? k.tags.toString() : '';
                var content = k.content ? k.content.toString() : '';
                var isMatch = keywords.every(keyword =>
                    tags.includes(keyword) || content.includes(keyword)
                );
                if (isMatch) {
                    results.push('[' + tags + ']: ' + content);
                }
            });

            if (results.length === 0) {
                return '沒有找到關於「' + query + '」的知識點～喵';
            }

            return results.reverse().slice(0, 5).join('\n');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.searchKnowledge', ex);
            return '搜尋知識庫時發生錯誤～喵💔';
        }
    };

    /**
     * 取得使用者狀態 (好感度)
     * @param {string} userId - 使用者 ID
     * @returns {object} { affection: number, lastInteraction: string }
     */
    googleSheet.getUserStats = (userId) => {
        try {
            var ss = Config.SHEET_ID ? SpreadsheetApp.openById(Config.SHEET_ID) : null;
            if (!ss) return { affection: 60, lastInteraction: '' };

            var ws = ss.getSheetByName('user_stats');

            // 如果沒有這個 sheet 就建立一個
            if (!ws) {
                ws = ss.insertSheet('user_stats');
                ws.appendRow(['userId', 'affection', 'last_interaction']);
            }

            var data = ws.getDataRange().getValues();

            for (var i = 1; i < data.length; i++) {
                if (data[i][0] === userId) {
                    return {
                        affection: parseInt(data[i][1]) || 60,
                        lastInteraction: data[i][2]
                    };
                }
            }

            // 新使用者：預設 60 分 (Level 3 - 信賴的夥伴)
            var defaultAffection = 60;
            var nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss");
            ws.appendRow([userId, defaultAffection, nowStr]);

            return { affection: defaultAffection, lastInteraction: nowStr };

        } catch (ex) {
            googleSheet.logError('GoogleSheet.getUserStats', ex);
            return { affection: 60, lastInteraction: '' }; // Fallback
        }
    };

    /**
     * 更新好感度
     * @param {string} userId - 使用者 ID
     * @param {number} delta - 變化值 (正數或負數)
     * @returns {number} 新的好感度
     */
    googleSheet.updateAffection = (userId, delta) => {
        try {
            var ss = Config.SHEET_ID ? SpreadsheetApp.openById(Config.SHEET_ID) : null;
            if (!ss) return 60;

            var ws = ss.getSheetByName('user_stats');
            if (!ws) return 60;

            var data = ws.getDataRange().getValues();
            var nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss");

            for (var i = 1; i < data.length; i++) {
                if (data[i][0] === userId) {
                    var current = parseInt(data[i][1]) || 60;
                    var newScore = current + delta;

                    // 限制範圍 0 - 100
                    if (newScore > 100) newScore = 100;
                    if (newScore < 0) newScore = 0;

                    ws.getRange(i + 1, 2).setValue(newScore); // 更新好感度
                    ws.getRange(i + 1, 3).setValue(nowStr);   // 更新互動時間
                    return newScore;
                }
            }
            // Should be handled by getUserStats normally, but just in case
            return 60;
        } catch (ex) {
            googleSheet.logError('GoogleSheet.updateAffection', ex);
            return 60;
        }
    };

    return googleSheet;
})();
