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
 * 定時任務 - 主動訊息檢查
 * 建議頻率：每 1 小時 (需手動設定 Time-driven trigger)
 */
function proactiveMessageCheck() {
    try {
        var adminId = Config.ADMIN_STRING.split(",")[0];
        if (!adminId) return;

        // 1. 取得最後一次對話時間
        // 注意：這裡假設 chat 表有 timestamp 且最後一筆就是最新的
        var lastChat = DB().from('chat').limitLoad(1).execute().last();

        var hoursSinceLastChat = 999; // 預設很久
        if (lastChat && lastChat.timestamp) {
            var lastTime = new Date(lastChat.timestamp).getTime();
            var nowTime = new Date().getTime();
            hoursSinceLastChat = (nowTime - lastTime) / (1000 * 60 * 60);
        }

        GoogleSheet.logInfo('proactiveMessageCheck', 'Hours since last chat: ' + hoursSinceLastChat.toFixed(1));

        // 2. 第一階段過濾 (Tier 1 Filter)：純邏輯判斷
        // 如果距離上次對話太近，直接結束，省流量
        if (hoursSinceLastChat < Config.PROACTIVE_CHECK_INTERVAL_HOURS) {
            GoogleSheet.logInfo('proactiveMessageCheck', 'Too soon to chat (Tier 1 Filter). Skip.');
            return;
        }

        // 3. 第二階段 (Tier 2)：AI 判斷
        // 只有真的很久沒講話了，才去問 AI 要不要說話
        var proactiveMsg = ChatBot.decideProactiveMessage(adminId, hoursSinceLastChat);

        if (proactiveMsg) {
            Line.pushMsg(adminId, proactiveMsg);
            GoogleSheet.logInfo('proactiveMessageCheck', 'Sent proactive message:', proactiveMsg);

            // 紀錄這筆主動發送的訊息到歷史，避免下次檢查誤判時間 (視為對話重置)
            // 同時也讓 AI 知道自己剛剛說了這句話
            // Format: userId, role, content
            // 我們可以使用 saveMessage 嗎？ ChatBot 內部沒有 expose saveMessage，
            // 但 reply 裡面有用到。我們可以考慮在 ChatBot 增加一個 logAssistantMessage
            // 或者直接在此處手動 insert DB?
            // 為了保持乾淨，我們假設 ChatBot.decideProactiveMessage 如果回傳了，代表它希望這句話被送出。
            // 我們應該也要把這句話寫入 chat history。
            // 由於 saveMessage 是 private，我們直接操作 DB。
            var nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss");
            DB().insert('chat')
                .set('userId', adminId)
                .set('role', 'assistant')
                .set('content', proactiveMsg)
                .set('timestamp', nowStr)
                .execute();
        } else {
            GoogleSheet.logInfo('proactiveMessageCheck', 'AI decided NOT to chat (Tier 2).');
        }

    } catch (ex) {
        GoogleSheet.logError('proactiveMessageCheck', ex);
    }
}

/**
 * 輔助函數：設定主動訊息的觸發器
 * 請在部署後手動執行一次此函數
 */
function setupTrigger() {
    // 先刪除舊的同名觸發器，避免重複
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'proactiveMessageCheck') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }

    // 建立新的每小時觸發器
    ScriptApp.newTrigger('proactiveMessageCheck')
        .timeBased()
        .everyHours(1)
        .create();

    Logger.log("主動訊息檢查觸發器已設定：每 1 小時執行一次。");
}

/**
 * 定時任務 - 行為模式分析
 * 建議頻率：每日深夜 (e.g. 03:00)
 */
function analyzeBehaviorPatterns() {
    try {
        Mind.analyzePatterns();
    } catch (ex) {
        GoogleSheet.logError('analyzeBehaviorPatterns', ex);
    }
}

/**
 * 輔助函數：設定行為分析的觸發器
 */
function setupAnalysisTrigger() {
    // 先刪除舊的
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'analyzeBehaviorPatterns') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }

    // 建立新的每日觸發器 (凌晨 3 點)
    ScriptApp.newTrigger('analyzeBehaviorPatterns')
        .timeBased()
        .everyDays(1)
        .atHour(3)
        .create();

    Logger.log("行為分析觸發器已設定：每日 03:00 執行。");
}

/**
 * 測試函數
 */
function test() {
    // 測試用
}
