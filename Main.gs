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
                    var event = jsonData.events[i];
                    var eventId = event.webhookEventId;

                    // Deduplication: 防止 LINE 重送導致的重複處理
                    var cache = CacheService.getScriptCache();
                    if (eventId && cache.get(eventId)) {
                        GoogleSheet.logInfo('doPost', 'Duplicate event ignored:', eventId);
                        continue;
                    }
                    if (eventId) {
                        cache.put(eventId, 'processed', 60);
                    }

                    Line.init(event);
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
 * 1. Stage 1: 清理舊對話 (單純刪除過期紀錄)
 * 2. Stage 2: 整理短期記憶 (轉存長期或遺忘)
 * 3. Stage 3: 清理舊行為日誌
 */
function dailyMemoryCleanUp() {
    try {
        var christinaSheet = SpreadsheetApp.openById(Config.SHEET_ID);
        var today = new Date();

        // ========== Stage 1: 清理舊對話 (Chat) ==========
        var sheetChat = christinaSheet.getSheetByName('chat');
        if (sheetChat) {
            var chatCleanupDays = Config.CHAT_CLEANUP_DAYS || 30; // 預設保留 30 天
            var cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - chatCleanupDays);

            var lastRow = sheetChat.getLastRow();
            if (lastRow > 1) {
                var data = sheetChat.getRange(2, 1, lastRow - 1, sheetChat.getLastColumn()).getValues();
                var rowsToDelete = [];

                // 從後往前遍歷
                for (var i = data.length - 1; i >= 0; i--) {
                    var timestamp = new Date(data[i][3]); // 假設 timestamp 在第 4 欄 (Col D)
                    if (timestamp < cutoffDate) {
                        rowsToDelete.push(i + 2);
                    }
                }

                // 批量刪除
                rowsToDelete.forEach(row => {
                    sheetChat.deleteRow(row);
                });
                if (rowsToDelete.length > 0) {
                    GoogleSheet.logInfo('dailyMemoryCleanUp', 'Cleaned ' + rowsToDelete.length + ' old chat rows (older than ' + chatCleanupDays + ' days)');
                }
            }
        }

        // ========== Stage 2: 整理短期記憶 (Short Term Memory) ==========
        var sheetSTM = christinaSheet.getSheetByName('short_term_memory');
        if (sheetSTM) {
            var lastRowSTM = sheetSTM.getLastRow();
            if (lastRowSTM > 1) {
                var dataSTM = sheetSTM.getRange(2, 1, lastRowSTM - 1, sheetSTM.getLastColumn()).getValues();
                var rowsToDeleteSTM = [];

                // 從後往前遍歷
                for (var i = dataSTM.length - 1; i >= 0; i--) {
                    var rowData = {
                        key: dataSTM[i][0],      // Col A
                        content: dataSTM[i][1],  // Col B
                        expire_at: new Date(dataSTM[i][2]) // Col C
                    };

                    // 判斷是否需要刪除 (過期 或 被轉存)
                    var shouldDelete = false;

                    // 交給 AI 判斷是否轉存長期記憶
                    // 注意：只評估那些還沒過期太久，或是內容豐富的條目
                    // 為避免浪費 Token，對於顯然是自動生成的 context summary 或過期很久的，可以考慮直接清掉
                    // 但目前維持原邏輯：全部評估一次，確保智慧沉澱
                    var decision = Mind.evaluateMemoryForLongTerm(rowData);
                    if (decision.keep) {
                        // 轉存長期
                        GoogleSheet.addKnowledge(decision.tags, decision.content);
                        GoogleSheet.logInfo('dailyMemoryCleanUp', 'Promoted STM to LTM:', decision.content);
                        shouldDelete = true; // 已經轉存，短期記憶任務完成
                    }

                    // 如果沒被轉存，但過期了 -> 遺忘
                    if (!shouldDelete && rowData.expire_at < today) {
                        shouldDelete = true;
                        GoogleSheet.logInfo('dailyMemoryCleanUp', 'STM expired (Forgotten):', rowData.key);
                    }

                    if (shouldDelete) {
                        rowsToDeleteSTM.push(i + 2);
                    }
                }

                // 批量刪除
                rowsToDeleteSTM.forEach(row => {
                    sheetSTM.deleteRow(row);
                });
                if (rowsToDeleteSTM.length > 0) {
                    GoogleSheet.logInfo('dailyMemoryCleanUp', 'Processed ' + rowsToDeleteSTM.length + ' STM rows');
                }
            }
        }

        // ========== Stage 3: 清理舊行為日誌 (Behavior Log) ==========
        var sheetLog = christinaSheet.getSheetByName('behavior_log');
        if (sheetLog) {
            var logCleanupDays = 60; // 行為日誌保留 60 天
            var logCutoffDate = new Date();
            logCutoffDate.setDate(logCutoffDate.getDate() - logCleanupDays);

            var lastRowLog = sheetLog.getLastRow();
            if (lastRowLog > 1) {
                // 假設 timestamp 在第 3 欄 (Col C: userId, action, timestamp...)
                // 需確認 GoogleSheet.logBehavior 的寫入順序，通常是 [userId, action, timestamp, context]
                var dataLog = sheetLog.getRange(2, 1, lastRowLog - 1, 3).getValues();
                var rowsToDeleteLog = [];

                for (var i = dataLog.length - 1; i >= 0; i--) {
                    var timestamp = new Date(dataLog[i][2]); // Col C
                    if (timestamp < logCutoffDate) {
                        rowsToDeleteLog.push(i + 2);
                    }
                }

                rowsToDeleteLog.forEach(row => {
                    sheetLog.deleteRow(row);
                });
                if (rowsToDeleteLog.length > 0) {
                    GoogleSheet.logInfo('dailyMemoryCleanUp', 'Cleaned ' + rowsToDeleteLog.length + ' behavior logs');
                }
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
            HistoryManager.saveMessage(adminId, 'assistant', proactiveMsg);
        } else {
            GoogleSheet.logInfo('proactiveMessageCheck', 'AI decided NOT to chat (Tier 2).');
        }

    } catch (ex) {
        GoogleSheet.logError('proactiveMessageCheck', ex);
    }
}

/**
 * 定時任務 - 系統維護 (行為分析 + 記憶整理)
 * 建議頻率：每 6 小時
 */
function performMaintenanceTasks() {
    try {
        Mind.performMaintenance();
    } catch (ex) {
        GoogleSheet.logError('performMaintenanceTasks', ex);
    }
}

/**
 * 一鍵設定所有定時任務觸發器 (Master Setup)
 * 注意：執行此函數會先刪除專案中「所有」的 Trigger，然後重新建立。
 */
function setupAllTriggers() {
    try {
        // 1. 刪除所有現有觸發器
        var triggers = ScriptApp.getProjectTriggers();
        for (var i = 0; i < triggers.length; i++) {
            ScriptApp.deleteTrigger(triggers[i]);
        }
        Logger.log("已清除 " + triggers.length + " 個舊觸發器。");

        // 2. 建立 [主動訊息檢查] - 每 1 小時
        ScriptApp.newTrigger('proactiveMessageCheck')
            .timeBased()
            .everyHours(1)
            .create();
        Logger.log("✅ 設定完成: proactiveMessageCheck (每 1 小時)");

        // 3. 建立 [系統維護] (短期記憶總結 + 行為分析) - 每 6 小時
        ScriptApp.newTrigger('performMaintenanceTasks')
            .timeBased()
            .everyHours(6)
            .create();
        Logger.log("✅ 設定完成: performMaintenanceTasks (每 6 小時)");

        // 4. 建立 [每日清理] (刪除舊資料 + 記憶沉澱) - 每日 04:00
        ScriptApp.newTrigger('dailyMemoryCleanUp')
            .timeBased()
            .everyDays(1)
            .atHour(4)
            .create();
        Logger.log("✅ 設定完成: dailyMemoryCleanUp (每日 04:00)");

        Logger.log("🎉 所有觸發器設定完畢！");

    } catch (ex) {
        Logger.log("❌ 設定觸發器時發生錯誤: " + ex.toString());
    }
}
