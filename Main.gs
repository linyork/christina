/**
 * Main
 * @description 主程式入口點
 */

/**
 * LINE Webhook 處理
 * @param {object} e - doPost 事件物件
 */
function doPost(e) {
    try {
        // 檢查是否為 LINE 請求
        if (Line.isLine(e.postData.contents)) {
            var jsonData = JSON.parse(e.postData.contents);
            if (jsonData.events != null) {
                for (var i in jsonData.events) {
                    Line.init(jsonData.events[i]);
                    Line.startEvent();
                }
            }
        }
    } catch (error) {
        GoogleSheet.logError('doPost', e.postData.contents, error);
    }
}

/**
 * 定時任務 - 提醒休息
 */
function takeBreak() {
    try {
        var adminId = Christina.adminString.split(",")[0];
        Line.pushMsg(adminId, "主人，現在起身走一走吧！我陪你一起走～喵❤️");
    } catch (ex) {
        GoogleSheet.logError('takeBreak', ex);
    }
}

/**
 * 定時任務 - 提醒記帳
 */
function recordAssets() {
    try {
        var adminId = Christina.adminString.split(",")[0];
        Line.pushMsg(adminId, "主人，現在是時候要登記資產了，我會陪你一起完成～喵❤️");
    } catch (ex) {
        GoogleSheet.logError('recordAssets', ex);
    }
}

/**
 * 定時任務 - 清空舊的 AI 對話
 */
function removeChat() {
    try {
        var sheetId = Config.SHEET_ID;
        var christinaSheet = SpreadsheetApp.openById(sheetId);
        var sheetChat = christinaSheet.getSheetByName('chat');

        if (!sheetChat) {
            GoogleSheet.logError('removeChat', 'chat sheet not found');
            return;
        }

        // 計算截止日期（30 天前）
        var cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Config.CHAT_CLEANUP_DAYS);
        var cutoffTimestamp = cutoffDate.toISOString();

        // 取得所有資料
        var lastRow = sheetChat.getLastRow();
        if (lastRow <= 1) return; // 只有標題列

        var data = sheetChat.getRange(2, 1, lastRow - 1, sheetChat.getLastColumn()).getValues();

        // 找出要刪除的行（從後往前刪除以避免索引問題）
        var rowsToDelete = [];
        for (var i = data.length - 1; i >= 0; i--) {
            var timestamp = data[i][3]; // 假設 timestamp 在第 4 欄（索引 3）
            if (timestamp && timestamp < cutoffTimestamp) {
                rowsToDelete.push(i + 2); // +2 因為陣列從 0 開始，且有標題列
            }
        }

        // 刪除行
        rowsToDelete.forEach(row => {
            sheetChat.deleteRow(row);
        });

        GoogleSheet.logInfo('removeChat', 'Cleaned ' + rowsToDelete.length + ' old messages');
    } catch (ex) {
        GoogleSheet.logError('removeChat', ex);
    }
}

/**
 * 測試函數
 */
function test() {
    // 測試用
}
