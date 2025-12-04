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
                        "topic": {
                            "type": "string",
                            "description": "知識點的主題或關鍵字，例如：WiFi密碼、生日、地址"
                        },
                        "content": {
                            "type": "string",
                            "description": "知識點的詳細內容"
                        }
                    },
                    "required": ["topic", "content"]
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
                "name": "decide_food",
                "description": "隨機決定要吃什麼。",
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
     * @returns {string} 執行結果
     */
    tools.execute = (functionName, args) => {
        try {
            GoogleSheet.logInfo('Tools.execute', 'Calling: ' + functionName, JSON.stringify(args));

            switch (functionName) {
                case 'add_knowledge':
                    return GoogleSheet.addKnowledge(args.topic, args.content);

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

                case 'decide_food':
                    var food = GoogleSheet.eatWhat();
                    return '建議吃：' + food + '～喵❤️';

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
