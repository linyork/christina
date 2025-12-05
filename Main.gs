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
        var adminId = Config.ADMIN_STRING.split(",")[0];
        // 讓 AI 生成貼心的提醒
        var instruction = "現在是休息時間。請用簡短、可愛、關心的語氣，提醒主人起來走動、喝水或休息一下。請不要太長，一句話或兩句話就好。";
        var msg = ChatBot.generateGreeting(instruction);

        Line.pushMsg(adminId, msg);
    } catch (ex) {
        GoogleSheet.logError('takeBreak', ex);
    }
}
/**
 * 定時任務 - 每日記憶整理 (Daily Memory Consolidation)
 * 1. 清理舊對話 -> 轉為短期記憶
 * 2. 整理短期記憶 -> 轉為長期記憶 (或遺忘)
 */
function dailyMemoryCleanUp() {
    try {
        var christinaSheet = SpreadsheetApp.openById(Config.SHEET_ID);
        var today = new Date();

        // ========== Stage 1: 清理舊對話 (超過 7 天) ==========
        var sheetChat = christinaSheet.getSheetByName('chat');
        if (sheetChat) {
            var cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 天前的對話

            var lastRow = sheetChat.getLastRow();
            if (lastRow > 1) {
                var data = sheetChat.getRange(2, 1, lastRow - 1, sheetChat.getLastColumn()).getValues();
                var rowsToDelete = [];
                var chatContentToSummarize = "";

                // 從後往前遍歷
                for (var i = data.length - 1; i >= 0; i--) {
                    var timestamp = new Date(data[i][3]); // 假設 timestamp 在第 4 欄
                    if (timestamp < cutoffDate) {
                        rowsToDelete.push(i + 2);
                        // 收集對話內容 (Role: Content)
                        chatContentToSummarize += (data[i][1] + ": " + data[i][2] + "\n"); // 假設 Role=Col2, Content=Col3
                    }
                }

                // 如果有舊對話，嘗試總結
                if (chatContentToSummarize) {
                    var summary = ChatBot.summarizeChatsToMemory(chatContentToSummarize);
                    if (summary) {
                        GoogleSheet.addShortTermMemory(summary.key, summary.content, 7 * 24); // 存入短期記憶，預設 7 天
                        GoogleSheet.logInfo('dailyMemoryCleanUp', 'Summarized chats to STM:', summary.key);
                    }
                }

                // 批量刪除
                rowsToDelete.forEach(row => {
                    sheetChat.deleteRow(row);
                });
                GoogleSheet.logInfo('dailyMemoryCleanUp', 'Cleaned ' + rowsToDelete.length + ' old chat rows');
            }
        }

        // ========== Stage 2: 整理短期記憶 ==========
        var sheetSTM = christinaSheet.getSheetByName('short_term_memory');
        if (sheetSTM) {
            var lastRowSTM = sheetSTM.getLastRow();
            if (lastRowSTM > 1) {
                var dataSTM = sheetSTM.getRange(2, 1, lastRowSTM - 1, sheetSTM.getLastColumn()).getValues();
                var rowsToDeleteSTM = [];

                // 從後往前遍歷
                for (var i = dataSTM.length - 1; i >= 0; i--) {
                    var rowData = {
                        key: dataSTM[i][0],      // Col 1
                        content: dataSTM[i][1],  // Col 2
                        expire_at: new Date(dataSTM[i][2]) // Col 3
                    };

                    // 判斷是否需要刪除 (過期 或 被轉存)
                    var shouldDelete = false;

                    // 交給 AI 判斷是否轉存長期記憶
                    var decision = ChatBot.evaluateMemoryForLongTerm(rowData);
                    if (decision.keep) {
                        // 轉存長期
                        GoogleSheet.addKnowledge(decision.tags, decision.content);
                        GoogleSheet.logInfo('dailyMemoryCleanUp', 'Promoted STM to LTM:', decision.content);
                        shouldDelete = true; // 已經轉存，短期記憶任務完成，可以刪除
                    }

                    // 如果過期了，也標記刪除 (遺忘)
                    if (rowData.expire_at < today) {
                        shouldDelete = true;
                        GoogleSheet.logInfo('dailyMemoryCleanUp', 'STM expired:', rowData.key);
                    }

                    if (shouldDelete) {
                        rowsToDeleteSTM.push(i + 2);
                    }
                }

                // 批量刪除
                rowsToDeleteSTM.forEach(row => {
                    sheetSTM.deleteRow(row);
                });
                GoogleSheet.logInfo('dailyMemoryCleanUp', 'Cleaned ' + rowsToDeleteSTM.length + ' STM rows');
            }
        }

    } catch (ex) {
        GoogleSheet.logError('dailyMemoryCleanUp', ex);
    }
}

/**
 * 測試函數
 */
function test() {
    // 測試用
}
