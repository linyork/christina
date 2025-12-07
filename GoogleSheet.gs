/**
 * GoogleSheet
 * @description Google Sheets 操作模組
 */
var GoogleSheet = (() => {
    var googleSheet = {};

    // Lazy loading helpers
    // Caching helper
    var _spreadsheetCache = null;
    var getChristinaSheet = () => {
        if (_spreadsheetCache) return _spreadsheetCache;
        _spreadsheetCache = SpreadsheetApp.openById(Config.SHEET_ID);
        return _spreadsheetCache;
    };
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
     * 記錄 error log (增強版)
     * @param {...*} msg - 訊息
     */
    googleSheet.logError = (...msg) => {
        var args = [...msg].map((v) => {
            if (v instanceof Error) {
                return JSON.stringify({
                    message: v.message,
                    name: v.name,
                    stack: v.stack
                });
            }
            if (typeof v === 'object' && v !== null) {
                // 嘗試處理某些特殊物件
                try {
                    return JSON.stringify(v);
                } catch (e) {
                    return v.toString();
                }
            }
            return v;
        });
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
     * 完成事項 (支援模糊搜尋)
     * @param {string} something - 完成的事項
     * @returns {string|null} 完成的事項名稱，若找不到則回傳 null
     */
    googleSheet.do = (something) => {
        try {
            // 1. 取得所有未完成事項
            var tasks = DB().from('todo').where('do', '=', 0).execute().get();
            var tasksArray = Array.isArray(tasks) ? tasks : (tasks.content ? [tasks] : []); // Handle DB.gs return quirks where single object might be returned or empty object
            if (Object.keys(tasks).length === 0 && !Array.isArray(tasks)) tasksArray = [];

            if (tasksArray.length === 0) return null;

            var targetTask = null;

            // 2. 嘗試搜尋 (Exact Match)
            targetTask = tasksArray.find(t => t.content === something);

            // 3. 嘗試搜尋 (Fuzzy Match: contains)
            if (!targetTask) {
                targetTask = tasksArray.find(t => t.content && (t.content.includes(something) || something.includes(t.content)));
            }

            if (targetTask) {
                // 4. 更新該事項 (使用 DB 中確切的 content 來當 key)
                DB().update('todo').where('content', '=', targetTask.content).set('do', 1).execute();
                return targetTask.content;
            } else {
                googleSheet.logInfo('GoogleSheet.do', 'Task not found:', something);
                return null;
            }
        } catch (ex) {
            googleSheet.logError('GoogleSheet.do', ex);
            return null;
        }
    };

    /**
     * 刪除事項 (支援模糊搜尋與 DB Row Deletion)
     * @param {string} something - 刪除的事項
     * @returns {string|null} 刪除的事項名稱，若找不到則回傳 null
     */
    googleSheet.deleteTodo = (something) => {
        try {
            // 1. 取得所有事項
            var tasks = DB().from('todo').execute().get();
            var tasksArray = Array.isArray(tasks) ? tasks : (tasks.content ? [tasks] : []);
            if (Object.keys(tasks).length === 0 && !Array.isArray(tasks)) tasksArray = [];

            if (tasksArray.length === 0) return null;

            var targetTask = null;

            // 2. 嘗試搜尋 (Exact Match)
            targetTask = tasksArray.find(t => t.content === something);

            // 3. 嘗試搜尋 (Fuzzy Match: contains)
            if (!targetTask) {
                targetTask = tasksArray.find(t => t.content && (t.content.includes(something) || something.includes(t.content)));
            }

            if (targetTask) {
                // 4. 刪除該事項 (使用 DB.deleteRows)
                // 注意：這裡使用 content 作為條件，若有重複內容，可能會一起刪除，但在 TODO 情境下通常可接受
                DB().deleteRows('todo').where('content', '=', targetTask.content).execute();
                return targetTask.content;
            } else {
                return null;
            }
        } catch (ex) {
            googleSheet.logError('GoogleSheet.deleteTodo', ex);
            return null;
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
     * 取得 User State Matrix
     * @param {string} userId - 使用者 ID
     * @returns {object}
     */
    googleSheet.getUserMatrix = (userId) => {
        try {
            var ss = Config.SHEET_ID ? SpreadsheetApp.openById(Config.SHEET_ID) : null;
            if (!ss) return null;

            var ws = ss.getSheetByName('user_matrix');
            // 如果沒有這個 sheet 就建立一個
            if (!ws) {
                ws = ss.insertSheet('user_matrix');
                ws.appendRow(['userId', 'mood', 'energy', 'busyness', 'last_topic', 'timestamp']);
            }

            var data = ws.getDataRange().getValues();
            for (var i = 1; i < data.length; i++) {
                if (data[i][0] === userId) {
                    return {
                        mood: data[i][1],
                        energy: data[i][2],
                        busyness: data[i][3],
                        last_topic: data[i][4],
                        timestamp: data[i][5]
                    };
                }
            }

            // Default state
            return {
                mood: 'calm',
                energy: 5,
                busyness: 'normal',
                last_topic: '',
                timestamp: new Date()
            };
        } catch (ex) {
            googleSheet.logError('GoogleSheet.getUserMatrix', ex);
            return null;
        }
    };

    /**
     * 更新 User State Matrix
     * @param {string} userId
     * @param {object} updates
     */
    googleSheet.updateUserMatrix = (userId, updates) => {
        try {
            var ss = Config.SHEET_ID ? SpreadsheetApp.openById(Config.SHEET_ID) : null;
            if (!ss) return;

            var ws = ss.getSheetByName('user_matrix');
            if (!ws) {
                ws = ss.insertSheet('user_matrix');
                ws.appendRow(['userId', 'mood', 'energy', 'busyness', 'last_topic', 'timestamp']);
            }

            var data = ws.getDataRange().getValues();
            var rowIndex = -1;
            var currentState = {
                mood: 'calm',
                energy: 5,
                busyness: 'normal',
                last_topic: '',
                timestamp: new Date()
            };

            // Find user
            for (var i = 1; i < data.length; i++) {
                if (data[i][0] === userId) {
                    rowIndex = i + 1;
                    currentState = {
                        mood: data[i][1],
                        energy: data[i][2],
                        busyness: data[i][3],
                        last_topic: data[i][4],
                        timestamp: data[i][5]
                    };
                    break;
                }
            }

            // Merge updates
            var newState = {
                mood: updates.mood || currentState.mood,
                energy: updates.energy || currentState.energy,
                busyness: updates.busyness || currentState.busyness,
                last_topic: updates.last_topic || currentState.last_topic,
                timestamp: Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss")
            };

            if (rowIndex > 0) {
                // Update
                ws.getRange(rowIndex, 2, 1, 5).setValues([[
                    newState.mood,
                    newState.energy,
                    newState.busyness,
                    newState.last_topic,
                    newState.timestamp
                ]]);
            } else {
                // Insert
                ws.appendRow([
                    userId,
                    newState.mood,
                    newState.energy,
                    newState.busyness,
                    newState.last_topic,
                    newState.timestamp
                ]);
            }
            googleSheet.logInfo('GoogleSheet.updateUserMatrix', 'Updated state for ' + userId, newState);

        } catch (ex) {
            googleSheet.logError('GoogleSheet.updateUserMatrix', ex);
        }
    };

    /**
     * 記錄行為日誌
     * @param {string} userId
     * @param {string} action
     * @param {string} context
     */
    googleSheet.logBehavior = (userId, action, context) => {
        try {
            // [Auto-Create Sheet Guard]
            var ss = Config.SHEET_ID ? SpreadsheetApp.openById(Config.SHEET_ID) : null;
            if (ss) {
                var ws = ss.getSheetByName('behavior_log');
                if (!ws) {
                    ws = ss.insertSheet('behavior_log');
                    ws.appendRow(['userId', 'timestamp', 'day_of_week', 'hour', 'action', 'context']);
                }
            }

            // 使用 DB 模組寫入
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");
            var dayOfWeek = now.getDay(); // 0-6
            var hour = now.getHours();

            DB().insert('behavior_log')
                .set('userId', userId)
                .set('timestamp', timestamp)
                .set('day_of_week', dayOfWeek)
                .set('hour', hour)
                .set('action', action)
                .set('context', context)
                .execute();

        } catch (ex) {
            googleSheet.logError('GoogleSheet.logBehavior', ex);
        }
    };

    /**
     * 取得最近的行為紀錄
     * @param {string} userId
     * @param {number} days - 取得幾天內的紀錄
     * @returns {array}
     */
    googleSheet.getRecentBehaviors = (userId, days) => {
        try {
            var allLogs = DB().from('behavior_log').where('userId', '=', userId).execute().get();
            if (!allLogs) return [];

            var logsArray = Array.isArray(allLogs) ? allLogs : [allLogs];
            if (logsArray.length === 0) return [];

            var now = new Date();
            var cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

            return logsArray.filter(log => {
                // DB timestamp format: YYYY/MM/DD HH:mm:ss
                var logTime = new Date(log.timestamp);
                return logTime >= cutoff;
            });
        } catch (ex) {
            googleSheet.logError('GoogleSheet.getRecentBehaviors', ex);
            return [];
        }
    };

    return googleSheet;
})();
