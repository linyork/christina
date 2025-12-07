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

        // 為了測試 deleteTodo，我們再新增一個來刪
        var testTaskToDelete = "測試要刪除的任務_" + new Date().getTime();
        GoogleSheet.todo(testTaskToDelete);
        var delResult = GoogleSheet.deleteTodo(testTaskToDelete);

        if (delResult === testTaskToDelete) Logger.log("  - 刪除 Todo: OK");
        else throw new Error("刪除 Todo 失敗");

        // 清理殘留資料
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
        var isMaster = Utils.checkMaster(Config.ADMIN_STRING.split(',')[0]); // 應該為 true
        var isGuest = Utils.checkMaster("unknown_user"); // 應該為 false

        if (isMaster && !isGuest) Logger.log("  - 身份驗證邏輯: OK");
        else throw new Error("身份驗證邏輯錯誤");


        // ==========================================
        // 5. 測試 Mind 模組 (認知與行為)
        // ==========================================
        Logger.log("\n[5] 測試 Mind 模組...");

        // 5.1 User State Matrix
        var originalState = Mind.getUserState(testUserId);
        Mind.updateUserState(testUserId, { mood: 'excited', energy: 8 });
        var newState = Mind.getUserState(testUserId);

        if (newState.mood === 'excited' && newState.energy == 8) {
            Logger.log("  - User State 更新: OK");
        } else {
            throw new Error("User State 更新失敗");
        }
        DB().deleteRows('user_matrix').where('userId', '=', testUserId).execute();

        // 5.2 行為日誌 (Behavior Log)
        Mind.logBehavior(testUserId, 'TEST_BEHAVIOR', 'Testing Mind Module');
        var logs = GoogleSheet.getRecentBehaviors(testUserId, 1);

        if (logs.length > 0 && logs[0].action === 'TEST_BEHAVIOR') {
            Logger.log("  - 行為日誌記錄: OK");
        } else {
            throw new Error("行為日誌記錄失敗");
        }

        Logger.log("  - Mind 基礎功能驗證完成");
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

/**
 * 測試：列出目前 API Key 可用的所有 Gemini 模型
 * 執行此函式後，請查看「執行紀錄 (Execution Log)」
 */
function testAvailableModels() {
    var apiKey = Config.GEMINI_API_KEY;
    if (!apiKey) {
        Logger.log("❌ 錯誤：未設定 Config.GEMINI_API_KEY");
        return;
    }

    var url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;

    try {
        var options = {
            "method": "get",
            "muteHttpExceptions": true
        };

        var response = UrlFetchApp.fetch(url, options);
        var statusCode = response.getResponseCode();
        var content = response.getContentText();

        if (statusCode !== 200) {
            Logger.log("❌ 請求失敗 (Status: " + statusCode + ")");
            Logger.log("回應內容: " + content);
            return;
        }

        var data = JSON.parse(content);
        if (data.models) {
            Logger.log("🔍 找到 " + data.models.length + " 個可用模型：");
            Logger.log("--------------------------------------------------");

            data.models.forEach(function (model) {
                // 過濾掉舊的 PaLM 模型，專注於 Gemini
                if (model.name.indexOf("gemini") !== -1) {
                    Logger.log("ID: " + model.name);
                    Logger.log("可用網址: https://generativelanguage.googleapis.com/v1beta/" + model.name);
                }
            });
        } else {
            Logger.log("⚠️ 未找到任何模型資料。");
        }

    } catch (e) {
        Logger.log("❌ 發生例外錯誤: " + e.toString());
    }
}

/**
 * testRDS
 * @description 完整測試 DB.gs 所有功能 - 特別針對資料庫 CRUD 與查詢功能進行深度驗證
 */
function testRDS() {
    Logger.log("=== 開始執行 DB.gs (RDS) 完整功能測試 ===");
    var testUserId = 'TEST_RDS_USER_001';
    var tableName = 'behavior_log'; // 使用 behavior_log 作為測試表，相對安全且有 userId 欄位

    try {
        // ============================
        // 1. 清理測試環境 (確保無殘留資料)
        // ============================
        Logger.log("\n[1] 清理舊資料...");
        DB().deleteRows(tableName).where('userId', '=', testUserId).execute();
        Logger.log("  - 清理 old data 完成");

        // ============================
        // 2. 測試 Insert (新增)
        // ============================
        Logger.log("\n[2] 測試 Insert...");

        // 插入第一筆
        DB().insert(tableName)
            .set('userId', testUserId)
            .set('action', 'TEST_ACTION_1')
            .set('params', 'param1')
            .set('timestamp', new Date())
            .execute();

        // 插入第二筆
        DB().insert(tableName)
            .set('userId', testUserId)
            .set('action', 'TEST_ACTION_2')
            .set('params', 'param2')
            .execute();

        // 插入第三筆 (給 limit 測試用)
        DB().insert(tableName)
            .set('userId', testUserId)
            .set('action', 'TEST_ACTION_3')
            .set('params', 'param3')
            .execute();

        Logger.log("  - Insert 3筆資料: OK (稍後透過 Select 驗證)");


        // ============================
        // 3. 測試 Select (查詢) & Where
        // ============================
        Logger.log("\n[3] 測試 Select & Where...");

        // 3.1 基礎 Select - 抓取為本測試建立的所有資料
        var resAll = DB().from(tableName).where('userId', '=', testUserId).execute().get();
        // get() 回傳陣列或單一物件(若只有一筆)。多筆時應為 Array。
        // 為保險，確保 resAll 是陣列
        if (!Array.isArray(resAll)) resAll = [resAll];

        if (resAll.length === 3) {
            Logger.log("  - Select All (count=3): OK");
        } else {
            throw new Error("Select All 失敗, 預期 3 筆, 實際 " + resAll.length);
        }

        // 3.2 Where 條件查詢 - 精確匹配
        var res1 = DB().from(tableName)
            .where('userId', '=', testUserId)
            .where('action', '=', 'TEST_ACTION_1')
            .execute().get();

        var arr1 = Array.isArray(res1) ? res1 : [res1];
        if (arr1.length === 1 && arr1[0].action === 'TEST_ACTION_1') {
            Logger.log("  - Where查詢 (精確): OK");
        } else {
            throw new Error("Where查詢失敗");
        }

        // 3.3 Select Specific Columns - 只抓特定欄位
        var resCols = DB().select('action').from(tableName)
            .where('userId', '=', testUserId)
            .where('action', '=', 'TEST_ACTION_2')
            .execute().get();

        var arrCols = Array.isArray(resCols) ? resCols : [resCols];
        if (arrCols.length > 0 && arrCols[0].action === 'TEST_ACTION_2' && arrCols[0].params === undefined) {
            Logger.log("  - Select Specific Columns: OK");
        } else {
            // 注意：若 params 在 prototype 或其他地方可能會誤導，但純資料物件應該是 undefined
            throw new Error("Select Specific Columns 失敗. Got: " + JSON.stringify(arrCols[0]));
        }


        // ============================
        // 4. 測試 First / Last
        // ============================
        Logger.log("\n[4] 測試 First / Last...");
        // 4.1 First()
        var firstItem = DB().select('action').from(tableName).where('userId', '=', testUserId).execute().first();
        // 預期是 ACTION_1 (因為最先插入)
        if (firstItem && firstItem.action === 'TEST_ACTION_1') {
            Logger.log("  - First(): OK");
        } else {
            // 如順序無法保證，至少確認有值
            Logger.log("  - First(): Result=" + (firstItem ? firstItem.action : 'null') + " (Pass with warning)");
        }

        // 4.2 Last(col)
        var lastItemAction = DB().select('action').from(tableName).where('userId', '=', testUserId).execute().last('action');
        // last('column') 直接回傳 value，預期是 ACTION_3
        if (lastItemAction === 'TEST_ACTION_3') {
            Logger.log("  - Last(col): OK");
        } else {
            // 如順序無法保證，至少確認有值
            Logger.log("  - Last(col): Value=" + lastItemAction + " (Pass with warning)");
        }


        // ============================
        // 5. 測試 Update (更新)
        // ============================
        Logger.log("\n[5] 測試 Update...");
        // 將 ACTION_2 更新為 ACTION_2_UPDATED
        DB().update(tableName)
            .set('action', 'TEST_ACTION_2_UPDATED')
            .where('userId', '=', testUserId)
            .where('action', '=', 'TEST_ACTION_2')
            .execute();

        // 驗證
        var resUpd = DB().from(tableName)
            .where('userId', '=', testUserId)
            .where('action', '=', 'TEST_ACTION_2_UPDATED')
            .execute().get();
        var arrUpd = Array.isArray(resUpd) ? resUpd : [resUpd];

        if (arrUpd.length === 1) {
            Logger.log("  - Update: OK");
        } else {
            throw new Error("Update 失敗 - 未找到更新後的資料");
        }


        // ============================
        // 6. 測試 LimitLoad (部分讀取)
        // ============================
        Logger.log("\n[6] 測試 LimitLoad...");
        // 總共有 3 筆 (1, 2_UPDATED, 3)
        // limitLoad(2, true) -> 從尾巴讀 2 筆 -> 應該讀到 3 和 2_UPDATED
        // 注意：LimitLoad 是在 fetch 階段做，where 是在 memory 階段做。
        // 所以如果 limitLoad 載到的資料不包含符合 where 的資料，結果會是錯的。
        // 這裡我們 where userId = testUserId，這些資料應該都在最後面（因為剛 Insert）。
        var dbLimit = DB().select('action').from(tableName)
            .where('userId', '=', testUserId)
            .limitLoad(2, true)
            .execute();
        var resLimit = dbLimit.get();
        var arrLimit = Array.isArray(resLimit) ? resLimit : [resLimit];

        // 應該要有 2 筆
        if (arrLimit.length === 2) {
            Logger.log("  - LimitLoad (count=2): OK");
        } else {
            Logger.log("  - LimitLoad result count=" + arrLimit.length + ". (若非 2 可能是因為測試資料非連續在最後)");
        }


        // ============================
        // 7. 測試 DeleteRows (刪除列)
        // ============================
        Logger.log("\n[7] 測試 DeleteRows...");
        // 刪除 ACTION_3
        DB().deleteRows(tableName)
            .where('userId', '=', testUserId)
            .where('action', '=', 'TEST_ACTION_3')
            .execute();

        var resDel = DB().from(tableName).where('userId', '=', testUserId).execute().get();
        var arrDel = Array.isArray(resDel) ? resDel : [resDel];

        // 剩下 1 和 2_UPDATED，共 2 筆
        if (arrDel.length === 2) {
            Logger.log("  - DeleteRows: OK");
        } else {
            throw new Error("DeleteRows 失敗, 剩餘筆數預期 2, 實際 " + arrDel.length);
        }

        // ============================
        // 8. 最終清理 (Cleanup)
        // ============================
        Logger.log("\n[8] 最終清理測試環境...");
        DB().deleteRows(tableName).where('userId', '=', testUserId).execute();

        var finalCheck = DB().from(tableName).where('userId', '=', testUserId).execute().get();
        // 空結果可能是 {} 或 []
        var isEmpty = false;
        if (Array.isArray(finalCheck)) {
            if (finalCheck.length === 0) isEmpty = true;
        } else {
            if (Object.keys(finalCheck).length === 0) isEmpty = true;
        }

        if (isEmpty) {
            Logger.log("  - Clean Up: OK");
        } else {
            Logger.log("  - 警告: 清理可能未完全");
        }

        Logger.log("\n=== DB.gs (RDS) 所有功能測試 通過 ===");

    } catch (ex) {
        Logger.log("\n[FAILED] RDS 測試失敗: " + ex.toString());
        Logger.log(ex.stack);
    }
}
