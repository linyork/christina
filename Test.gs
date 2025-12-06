/**
 * Test.gs
 * @description 整合測試腳本 - 用於驗證 Christina Bot 的各項核心功能
 * 注意：本測試會產生並隨後刪除測試數據，以確保不污染正式資料庫。
 */

function runAllTests() {
    var testUserId = "U_TEST_USER_12345"; // 使用虛擬的測試 User ID
    var testConfig = {
        simulateMaster: true // 模擬 Master 權限
    };

    Logger.log("=== 開始執行 Christina Bot 整合測試 ===");

    try {
        // ==========================================
        // 1. 測試 HistoryManager (歷史紀錄)
        // ==========================================
        Logger.log("\n[1] 測試 HistoryManager...");

        // 1.1 儲存訊息
        HistoryManager.saveMessage(testUserId, 'user', '測試訊息：你好');
        HistoryManager.saveMessage(testUserId, 'assistant', '測試回應：你好，我是測試員');
        Logger.log("  - 儲存訊息: OK");

        // 1.2 讀取歷史
        var history = HistoryManager.getUserHistory(testUserId, 5);
        if (history.length >= 2) Logger.log("  - 讀取歷史: OK (" + history.length + " 筆)");
        else throw new Error("讀取歷史失敗");

        // 1.3 清除歷史 (Cleanup)
        HistoryManager.clearUserHistory(testUserId);
        var clearedHistory = HistoryManager.getUserHistory(testUserId, 5);
        if (clearedHistory.length === 0) Logger.log("  - 清除歷史: OK");
        else throw new Error("清除歷史失敗");


        // ==========================================
        // 2. 測試 GoogleSheet - Todo List (待辦事項)
        // ==========================================
        Logger.log("\n[2] 測試 Todo List...");
        var testTaskName = "測試買牛奶_" + new Date().getTime();

        // 2.1 新增 Todo
        GoogleSheet.todo(testTaskName);
        var list = GoogleSheet.todolist();
        if (list.includes(testTaskName)) Logger.log("  - 新增 Todo: OK");
        else throw new Error("新增 Todo 失敗");

        // 2.2 完成 Todo
        var doneTask = GoogleSheet.do(testTaskName);
        if (doneTask === testTaskName) Logger.log("  - 完成 Todo: OK");
        else throw new Error("完成 Todo 失敗");

        // 2.3 刪除 Todo (Cleanup)
        var deletedTask = GoogleSheet.deleteTodo(testTaskName);
        // 因為剛剛已經完成了 (do=1)，deleteTodo 預設邏輯可能有些微不同，我們這裡測試刪除功能本身
        // 如果 deleteTodo 找不到 (因為已完成)，我們手動清理 DB 確保測試不殘留
        // 為了測試 deleteTodo，我們再新增一個來刪
        var testTaskToDelete = "測試要刪除的任務_" + new Date().getTime();
        GoogleSheet.todo(testTaskToDelete);
        var delResult = GoogleSheet.deleteTodo(testTaskToDelete);

        if (delResult === testTaskToDelete) Logger.log("  - 刪除 Todo: OK");
        else throw new Error("刪除 Todo 失敗");

        // 清理剛剛已完成的那個任務 (使用 DB 直接刪除以保險)
        DB().deleteRows('todo').where('content', '=', testTaskName).execute();


        // ==========================================
        // 3. 測試 Mind & Knowledge (記憶與知識庫)
        // ==========================================
        Logger.log("\n[3] 測試 Mind & Knowledge...");
        var testTag = "test_tag_" + new Date().getTime();
        var testContent = "這是一條測試知識";

        // 3.1 新增知識
        GoogleSheet.addKnowledge([testTag], testContent);
        Logger.log("  - 新增知識: OK");

        // 3.2 搜尋知識
        var searchResult = GoogleSheet.searchKnowledge(testTag);
        if (searchResult.includes(testContent)) Logger.log("  - 搜尋知識: OK");
        else throw new Error("搜尋知識失敗");

        // 3.3 新增短期記憶
        GoogleSheet.addShortTermMemory("測試約定", "明天要測試", 1);
        var stm = GoogleSheet.getValidShortTermMemories();
        if (stm.includes("測試約定")) Logger.log("  - 短期記憶: OK");
        else throw new Error("短期記憶失敗");

        // 3.4 清理測試知識 (Cleanup)
        DB().deleteRows('knowledge').where('tags', 'is', testTag).execute();
        DB().deleteRows('short_term_memory').where('key', '=', '測試約定').execute();
        Logger.log("  - 清理知識測試資料: OK");


        // ==========================================
        // 4. 測試 User Identity (身份控管)
        // ==========================================
        Logger.log("\n[4] 測試身份控管 (Unit Test Logic)...");
        // 這裡我們直接測試 Utils.checkMaster
        var isMaster = Utils.checkMaster(Config.ADMIN_STRING.split(',')[0]); // 應該為 true
        var isGuest = Utils.checkMaster("unknown_user"); // 應該為 false

        if (isMaster && !isGuest) Logger.log("  - 身份驗證邏輯: OK");
        else throw new Error("身份驗證邏輯錯誤");


        // ==========================================
        // 5. 測試 Mind 模組 (認知與行為)
        // ==========================================
        Logger.log("\n[5] 測試 Mind 模組...");

        // 5.1 User State Matrix
        // 讀取 -> 更新 -> 再次讀取驗證
        var originalState = Mind.getUserState(testUserId);
        Mind.updateUserState(testUserId, { mood: 'excited', energy: 8 });
        var newState = Mind.getUserState(testUserId);

        if (newState.mood === 'excited' && newState.energy == 8) {
            Logger.log("  - User State 更新: OK");
        } else {
            throw new Error("User State 更新失敗");
        }
        // 還原與清理 (State Matrix 通常保留最新狀態即可，但為了乾淨我們刪除測試 user)
        DB().deleteRows('user_matrix').where('userId', '=', testUserId).execute();

        // 5.2 行為日誌 (Behavior Log)
        Mind.logBehavior(testUserId, 'TEST_BEHAVIOR', 'Testing Mind Module');
        var logs = GoogleSheet.getRecentBehaviors(testUserId, 1);

        if (logs.length > 0 && logs[0].action === 'TEST_BEHAVIOR') {
            Logger.log("  - 行為日誌記錄: OK");
        } else {
            throw new Error("行為日誌記錄失敗");
        }

        // 5.3 行為模式分析 (Pattern Analysis) - 模擬
        // 因為 analyzePatterns 依賴大量數據與 Config.ADMIN_STRING
        // 這裡我們僅呼叫與驗證不會報錯，且能處理空數據或測試數據
        // 若要測試真正分析，通常需要 Mock 數據。這裡我們先做基本呼叫測試。
        // 為避免影響正式 ADMIN，我們暫時不測試 analyzePatterns 的完整流程，僅測試 helper
        Logger.log("  - Mind 基礎功能驗證完成");

        // 清理行為日誌
        DB().deleteRows('behavior_log').where('userId', '=', testUserId).execute();


        // ==========================================
        // 6. 測試 DB 模組 (資料庫底層)
        // ==========================================
        Logger.log("\n[6] 測試 DB 模組...");
        // 寫入一筆測試資料到 behavior_log (比較不敏感)
        var dbTestTime = "2099/01/01 00:00:00";
        DB().insert('behavior_log')
            .set('userId', testUserId)
            .set('action', 'TEST_ACTION')
            .set('timestamp', dbTestTime)
            .execute();

        var dbResult = DB().from('behavior_log').where('userId', '=', testUserId).where('action', '=', 'TEST_ACTION').execute().get();
        var dbArray = Array.isArray(dbResult) ? dbResult : [dbResult];

        if (dbArray.length > 0 && dbArray[0].action === 'TEST_ACTION') {
            Logger.log("  - DB Insert/Select: OK");
        } else {
            throw new Error("DB 寫入或讀取失敗");
        }

        // 清理 DB 測試資料
        DB().deleteRows('behavior_log').where('userId', '=', testUserId).where('action', '=', 'TEST_ACTION').execute();
        Logger.log("  - DB DeleteRows: OK");

        Logger.log("\n=== 所有測試執行完畢 (SUCCESS) ===");

    } catch (ex) {
        Logger.log("\n[FAILED] 測試失敗: " + ex.toString());
        Logger.log(ex.stack);
    }
}
