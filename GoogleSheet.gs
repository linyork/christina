/**
 * GoogleSheet
 * @description Google Sheets 操作模組
 */
var GoogleSheet = (() => {
    var googleSheet = {};
    var christinaSheet = SpreadsheetApp.openById(Config.SHEET_ID);
    var sheetConsoleLog = christinaSheet.getSheetByName('consolelog');
    var sheetEat = christinaSheet.getSheetByName('eat_what');

    /**
     * 取得 LINE 狀態
     */
    googleSheet.lineStatus = (() => {
        try {
            return DB().from('christina').execute().first('status');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.lineStatus', ex);
            return false;
        }
    })();

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
        if (sheetConsoleLog != null) {
            var newRow = sheetConsoleLog.getLastRow() + 1;
            sheetConsoleLog.getRange(newRow, 1, 1, values.length).setValues([values]);
        }
    };

    /**
     * 記錄 info log
     * @param {...*} msg - 訊息
     */
    googleSheet.logInfo = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('info');
        googleSheet.setLog(args);
    };

    /**
     * 記錄 send log
     * @param {...*} msg - 訊息
     */
    googleSheet.logSend = (...msg) => {
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
            var lastRow = sheetEat.getLastRow();
            var lastColumn = sheetEat.getLastColumn();
            var data = sheetEat.getRange(1, 1, lastRow, lastColumn).getValues();
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
     * 取得最新資產
     * @returns {*}
     */
    googleSheet.money = () => {
        try {
            return DB().from('money').execute().last('money');
        } catch (ex) {
            googleSheet.logError('GoogleSheet.money', ex);
            return 0;
        }
    };

    /**
     * 登錄資產
     * @param {number} money - 金額
     */
    googleSheet.insertMoney = (money) => {
        try {
            var today = new Date();
            var date = today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate();
            DB().insert('money').set('money', money).set('date', date).execute();
        } catch (ex) {
            googleSheet.logError('GoogleSheet.insertMoney', ex);
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
                returnString = returnString + "[ ]" + todoList[i].content + "\\n";
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
            var sheetChat = christinaSheet.getSheetByName('chat');
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

    return googleSheet;
})();
