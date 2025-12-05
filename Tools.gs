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
                "name": "add_knowledge",
                "description": "將重要的資訊或知識點儲存到長期記憶庫中。當使用者要求「記住」、「記下來」、「記錄」某些資訊時使用。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "tags": {
                            "type": "array",
                            "items": {
                                "type": "string"
                            },
                            "description": "知識點的標籤列表，例如：['WiFi', '密碼']"
                        },
                        "content": {
                            "type": "string",
                            "description": "知識點的詳細內容"
                        }
                    },
                    "required": ["tags", "content"]
                }
            },
            {
                "name": "add_short_term_memory",
                "description": "將暫時性的資訊儲存到短期記憶庫中，並設定過期時間。適用於約定、提醒、臨時代辦事項等不需要永久記住的資訊。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "key": {
                            "type": "string",
                            "description": "記憶的主題或摘要，例如：晚餐約定"
                        },
                        "content": {
                            "type": "string",
                            "description": "詳細內容，例如：明天晚上7點吃拉麵"
                        },
                        "duration_hours": {
                            "type": "number",
                            "description": "記憶有效時數 (小時)，例如：24"
                        }
                    },
                    "required": ["key", "content", "duration_hours"]
                }
            },
            {
                "name": "search_knowledge",
                "description": "從長期記憶庫中搜尋相關的知識點。當使用者詢問之前記錄過的資訊時使用。",
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
                "name": "add_todo",
                "description": "新增待辦事項。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "待辦事項內容"
                        }
                    },
                    "required": ["task"]
                }
            },
            {
                "name": "get_todo_list",
                "description": "取得待辦事項列表。",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "complete_todo",
                "description": "標記待辦事項為已完成。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": "要標記為完成的待辦事項內容"
                        }
                    },
                    "required": ["task"]
                }
            },
            {
                "name": "get_meme",
                "description": "取得梗圖圖片連結，當使用者要求看梗圖或特定圖片時使用。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "keyword": {
                            "type": "string",
                            "description": "梗圖關鍵字，例如：黑人問號"
                        }
                    },
                    "required": ["keyword"]
                }
            },
            {
                "name": "leave_current_group",
                "description": "讓機器人離開目前的群組或聊天室。當使用者說「滾」、「離開」時使用。",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_user_id",
                "description": "取得使用者的 LINE User ID。",
                "parameters": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "clear_history",
                "description": "清除使用者與機器人的所有對話紀錄（重置記憶）。",
                "parameters": {
                    "type": "object",
                    "properties": {}
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
            GoogleSheet.logInfo('Tools.execute', 'Calling: ' + functionName, JSON.stringify(args));
            var event = context || {};

            // 安全檢查：只有 Master 可以執行工具
            if (!event.isMaster) {
                return '指令執行失敗：使用者權限不足。請告知使用者您只服務主人，無法執行此操作。';
            }

            switch (functionName) {
                case 'add_knowledge':
                    return GoogleSheet.addKnowledge(args.tags, args.content);

                case 'add_short_term_memory':
                    return GoogleSheet.addShortTermMemory(args.key, args.content, args.duration_hours);

                case 'search_knowledge':
                    return GoogleSheet.searchKnowledge(args.query);

                case 'add_todo':
                    GoogleSheet.todo(args.task);
                    return '已新增待辦事項：' + args.task + '～喵❤️';

                case 'get_todo_list':
                    var todoList = GoogleSheet.todolist();
                    return todoList || '目前沒有待辦事項～喵❤️';

                case 'complete_todo':
                    GoogleSheet.do(args.task);
                    return '已完成：' + args.task + '！主人好棒～喵❤️';

                case 'get_meme':
                    var url = GoogleDrive.getImageUrl(args.keyword + '.jpg');
                    if (url) {
                        return '找到梗圖了！連結：' + url;
                    } else {
                        return '找不到這張梗圖QQ～喵嗚嗚💔';
                    }

                case 'leave_current_group':
                    if (event.source && event.source.type && event.sourceId) {
                        // 因為這是同步回應，我們先回傳訊息，然後再執行離開 (可能會失敗如果已經離開)
                        // 更好的做法是回傳「好的，我走了」，然後 AI 回應完後，Line.gs 根據 AI 回應再執行？
                        // 但這裡是 Tool，我們直接執行離開比較乾脆。
                        // 不過 AI 還要回傳訊息，如果我們直接離開，最後的 replyMsg 可能會失敗。
                        // 所以我們回傳文字，讓 AI 說再見，然後由使用者再次確認或我們延遲離開?
                        // 或許直接呼叫 Line.leave 即可，API 應該會允許在離開前發出最後一個請求
                        Line.leave(event.source.type, event.sourceId);
                        return 'Christina 已離開群組～喵';
                    }
                    return '無法離開，找不到群組 ID';

                case 'get_user_id':
                    return '您的 User ID 是：' + (event.source ? event.source.userId : '未知');

                case 'clear_history':
                    if (event.source && event.source.userId) {
                        ChatBot.clearUserHistory(event.source.userId);
                        return '已清除所有對話紀錄，回到原廠設定～喵❤️';
                    }
                    return '無法清除，找不到 User ID';

                default:
                    GoogleSheet.logError('Tools.execute', 'Unknown function: ' + functionName);
                    return '找不到這個功能～喵💔';
            }
        } catch (ex) {
            GoogleSheet.logError('Tools.execute', functionName, ex);
            return '執行功能時發生錯誤～喵💔';
        }
    };

    return tools;
})();
