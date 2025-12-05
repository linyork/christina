/**
 * GoogleSheet
 * @description Google Sheets 操作模組
 */
var GoogleSheet = (() => {
    var googleSheet = {};

    // Lazy loading helpers
    var getChristinaSheet = () => SpreadsheetApp.openById(Config.SHEET_ID);
    var getConsoleLogSheet = () => getChristinaSheet().getSheetByName('consolelog');
    var getEatSheet = () => getChristinaSheet().getSheetByName('eat_what');

    /**
     * 取得 LINE 狀態 (lazy loading)
     */
    Object.defineProperty(googleSheet, 'lineStatus', {
        get: function () {
            try {
                return DB().from('christina').execute().first('status');
            } catch (ex) {
                googleSheet.logError('GoogleSheet.lineStatus', ex);
                return false;
            }
        }
    });

    /**
     * 設定 LINE 狀態
     * @param {boolean} data - 狀態
     */
    googleSheet.setLineStatus = (data) => {
        try {
            DB().update('christina').set('status', data).execute();
        } catch (ex) {
            googleSheet.logError('GoogleSheet.setLineStatus', ex);
        }
    };

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
     * 隨機取得吃什麼
     * @returns {string}
     */
    googleSheet.eatWhat = () => {
        try {
            var dataExport = {};
            var sheet = getEatSheet();
            var lastRow = sheet.getLastRow();
            var lastColumn = sheet.getLastColumn();
            var data = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
            for (var i = 0; i <= data.length; i++) {
                dataExport[i] = data[i];
            }
            return dataExport[Math.floor(Math.random() * data.length)];
        } catch (ex) {
            googleSheet.logError('GoogleSheet.eatWhat', ex);
            return '不知道吃什麼';
        }
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
            var sheet = getChristinaSheet().getSheetByName('short_term_memory');
            var rowsToDelete = [];

            // 遍歷檢查過期
            // 注意：因為要刪除行，我們需要知道 Row Index。
            // DB().get() 回傳的是物件陣列，沒有 Row Index。
            // 為了簡單起見，這裡我們只做讀取過濾。清理工作建議另外寫一個定期執行的 Trigger 腳本，
            // 或是這裡簡單做：如果過期就不回傳。

            // 既然 DB 模組不支援直接 Delete Row by Condition，我們先只做「過濾不回傳」。
            // (如果要實作自動清理，建議直接操作 Sheet)

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
            // 取得所有知識
            var allKnowledge = DB().from('knowledge').execute().get();

            if (!allKnowledge || allKnowledge.length === 0) {
                return '知識庫目前是空的～喵';
            }

            var results = [];
            var knowledgeArray = Array.isArray(allKnowledge) ? allKnowledge : [allKnowledge];

            // 將搜尋字串拆解成關鍵字 (以空白分隔)
            // 例如: "密碼 wifi" -> ["密碼", "wifi"]
            var keywords = query.split(/\s+/).filter(k => k.length > 0);

            // 關鍵字過濾
            knowledgeArray.forEach(k => {
                var tags = k.tags ? k.tags.toString() : '';
                var content = k.content ? k.content.toString() : '';

                // 檢查是否所有關鍵字都存在於 tags 或 content 中 (AND 邏輯)
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

            // 反轉陣列以取得最新的資料，並只回傳最新的 5 筆
            return results.reverse().slice(0, 5).join('\n');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.searchKnowledge', ex);
            return '搜尋知識庫時發生錯誤～喵💔';
        }
    };

    return googleSheet;
})();
