/**
 * Tools
 * @description Gemini Function Calling 工具定義
 * 將 GoogleSheet 的功能包裝成 AI 可呼叫的工具
 */
var Tools = (() => {
    var tools = {};

    /**
     * 取得所有工具的定義 (Gemini Function Calling Schema)
     * @returns {array} 工具定義陣列
     */
    tools.getDefinitions = () => {
        return [
            {
                "name": "manage_memory",
                "description": "【記憶中樞】管理長期與短期記憶。請嚴格區分：\n1. 長期知識 (add_knowledge)：永久性事實 (喜好、價值觀、專業知識)。\n2. 短期記憶 (add_short_term)：暫時性資訊 (約定、待辦、提醒)。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["add_knowledge", "add_short_term", "search"],
                            "description": "【嚴格選擇】\n- add_knowledge: 僅限「永久性」事實 (如：主人不吃辣、主人生日)。\n- add_short_term: 僅限「暫時性」資訊 (如：明天要開會、晚餐吃什麼)。\n- search: 搜尋記憶。"
                        },
                        "content": {
                            "type": "string",
                            "description": "內容 (用於新增) 或 搜尋關鍵字 (用於搜尋)"
                        },
                        "tags": {
                            "type": "array",
                            "items": { "type": "string" },
                            "description": "標籤列表 (僅用於 add_knowledge)，例如：['WiFi', '密碼']"
                        },
                        "key": {
                            "type": "string",
                            "description": "記憶主題/摘要 (僅用於 add_short_term)"
                        },
                        "duration_hours": {
                            "type": "number",
                            "description": "有效時數 (僅用於 add_short_term)，例如：24"
                        }
                    },
                    "required": ["action", "content"]
                }
            },
            {
                "name": "manage_calendar",
                "description": "管理行事曆。包含新增、查詢、修改、刪除行程。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["add", "check", "update", "delete"],
                            "description": "執行動作"
                        },
                        "title": {
                            "type": "string",
                            "description": "活動標題 (新增/修改用)"
                        },
                        "start_time": {
                            "type": "string",
                            "description": "開始時間 YYYY/MM/DD HH:mm:ss (新增/修改用)"
                        },
                        "duration_hours": {
                            "type": "number",
                            "description": "持續時數 (新增/修改用)"
                        },
                        "days": {
                            "type": "number",
                            "description": "查詢未來幾天 (check 用)"
                        },
                        "search_date": {
                            "type": "string",
                            "description": "目標活動日期 YYYY/MM/DD (修改/刪除時定位用)"
                        },
                        "search_keyword": {
                            "type": "string",
                            "description": "目標活動關鍵字 (修改/刪除時定位用)"
                        }
                    },
                    "required": ["action"]
                }
            },
            {
                "name": "manage_todo",
                "description": "管理待辦事項清單。包含新增、查看、完成、刪除。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["add", "list", "complete", "delete"],
                            "description": "執行動作"
                        },
                        "task": {
                            "type": "string",
                            "description": "待辦事項內容 (新增/完成/刪除 時必填)"
                        }
                    },
                    "required": ["action"]
                }
            },
            {
                "name": "search_web",
                "description": "【高優先】搜尋網路即時資訊。當問及新聞、天氣詳情、評價或不懂的事物時使用。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "搜尋關鍵字"
                        }
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "system_control",
                "description": "系統控制工具。注意：這包含危險操作，請謹慎使用。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["get_user_id", "leave_group", "clear_history"],
                            "description": "執行動作：\n- get_user_id: 查詢使用者 ID。\n- leave_group: 離開群組。\n- clear_history: 【極度危險】清除所有對話紀錄。⚠️ 嚴格禁止自主使用！只有在主人「明確要求」清除歷史或重置對話時才能執行。"
                        }
                    },
                    "required": ["action"]
                }
            }
        ];
    };

    /**
     * 執行工具函數
     * @param {string} functionName - 函數名稱
     * @param {object} args - 函數參數
     * @param {object} context - 上下文物件 (包含 line event)
     * @returns {string} 執行結果
     */
    tools.execute = (functionName, args, context) => {
        try {
            GoogleSheet.logInfo('Tools.execute', `Calling: ${functionName} [${args.action || ''}]`, JSON.stringify(args));
            var event = context || {};

            if (!event.isMaster) {
                return '指令執行失敗：使用者權限不足。請告知使用者您只服務主人，無法執行此操作。';
            }

            switch (functionName) {
                // ============================
                // Memory Management
                // ============================
                case 'manage_memory':
                    switch (args.action) {
                        case 'add_knowledge':
                            return GoogleSheet.addKnowledge(args.tags, args.content);
                        case 'add_short_term':
                            return GoogleSheet.addShortTermMemory(args.key, args.content, args.duration_hours);
                        case 'search':
                            return GoogleSheet.searchKnowledge(args.content); // content 作為 query
                        default:
                            return '未知的 Memory 指令';
                    }

                // ============================
                // Calendar Management
                // ============================
                case 'manage_calendar':
                    switch (args.action) {
                        case 'add':
                            return GoogleCalendar.createEvent(args.title, args.start_time, args.duration_hours);
                        case 'check':
                            return GoogleCalendar.getUpcomingEvents(args.days || 3);
                        case 'update':
                            return GoogleCalendar.updateEvent(args.search_keyword, args.search_date, args.new_title || args.title, args.new_start_time || args.start_time, args.new_duration || args.duration_hours);
                        case 'delete':
                            return GoogleCalendar.deleteEvent(args.search_keyword, args.search_date);
                        default:
                            return '未知的 Calendar 指令';
                    }

                // ============================
                // Todo Management
                // ============================
                case 'manage_todo':
                    switch (args.action) {
                        case 'add':
                            GoogleSheet.todo(args.task);
                            return '已新增待辦事項：' + args.task + '～喵❤️';
                        case 'list':
                            var list = GoogleSheet.todolist();
                            return list || '目前沒有待辦事項～喵❤️';
                        case 'delete':
                            var deleted = GoogleSheet.deleteTodo(args.task);
                            return deleted ? `已移除「${deleted}」～喵！` : `找不到「${args.task}」可以刪除耶...`;
                        case 'complete':
                            var done = GoogleSheet.do(args.task);
                            return done ? `已完成「${done}」！主人好棒～喵❤️` : `找不到「${args.task}」...`;
                        default:
                            return '未知的 Todo 指令';
                    }

                // ============================
                // System Control
                // ============================
                case 'system_control':
                    switch (args.action) {
                        case 'get_user_id':
                            return '您的 User ID 是：' + (event.source ? event.source.userId : '未知');
                        case 'leave_group':
                            if (event.source && event.source.type && event.sourceId) {
                                Line.leave(event.source.type, event.sourceId);
                                return 'Christina 已離開群組～喵';
                            }
                            return '無法離開，找不到群組 ID';
                        case 'clear_history':
                            if (event.source && event.source.userId) {
                                HistoryManager.clearUserHistory(event.source.userId);
                                return '已清除所有對話紀錄，回到原廠設定～喵❤️';
                            }
                            return '無法清除，找不到 User ID';

                        default:
                            return '未知的 System 指令';
                    }

                // ============================
                // Standalone Tools
                // ============================
                case 'search_web':
                    var apiKey = Config.GOOGLE_SEARCH_KEY;
                    var cx = Config.GOOGLE_SEARCH_CX;
                    if (!apiKey || !cx) return "搜尋失敗：請檢查 API Key 設定～喵💔";

                    var query = args.query;
                    var searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`;

                    try {
                        var response = UrlFetchApp.fetch(searchUrl, { muteHttpExceptions: true });
                        if (response.getResponseCode() !== 200) return `搜尋失敗 (${response.getResponseCode()})`;
                        var data = JSON.parse(response.getContentText());
                        if (!data.items || data.items.length === 0) return `找不到關於「${query}」的資料耶～喵💔`;

                        var resultText = `【搜尋結果：${query}】\n`;
                        for (var i = 0; i < Math.min(3, data.items.length); i++) {
                            var item = data.items[i];
                            resultText += `${i + 1}. [${item.title}] \n${item.snippet}\n\n`;
                        }
                        return resultText;
                    } catch (e) {
                        GoogleSheet.logError('Tools.search_web', e);
                        return "搜尋錯誤：" + e.toString();
                    }

                default:
                    return '找不到這個功能～喵💔';
            }
        } catch (ex) {
            GoogleSheet.logError('Tools.execute', functionName, ex);
            return '執行功能時發生錯誤～喵💔';
        }
    };

    return tools;
})();
