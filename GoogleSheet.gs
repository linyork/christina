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
     * @param {string} topic - 主題/關鍵字
     * @param {string} content - 內容
     * @returns {string} 執行結果訊息
     */
    googleSheet.addKnowledge = (topic, content) => {
        try {
            // 轉換為台灣時間格式 (YYYY/MM/DD HH:mm:ss)
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            DB().insert('knowledge')
                .set('topic', topic)
                .set('content', content)
                .set('timestamp', timestamp)
                .execute();
            googleSheet.logInfo('GoogleSheet.addKnowledge', 'Added knowledge: ' + topic);
            return '已將知識點「' + topic + '」記錄下來了～喵❤️';
        } catch (ex) {
            googleSheet.logError('GoogleSheet.addKnowledge', ex);
            return '記錄知識點時發生錯誤～喵💔';
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

            // 簡單的關鍵字過濾
            knowledgeArray.forEach(k => {
                if ((k.topic && k.topic.includes(query)) || (k.content && k.content.includes(query))) {
                    results.push('[' + k.topic + ']: ' + k.content);
                }
            });

            if (results.length === 0) {
                return '沒有找到關於「' + query + '」的知識點～喵';
            }

            // 最多回傳 5 筆，避免 Token 爆炸
            return results.slice(0, 5).join('\n');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.searchKnowledge', ex);
            return '搜尋知識庫時發生錯誤～喵💔';
        }
    };

    return googleSheet;
})();
