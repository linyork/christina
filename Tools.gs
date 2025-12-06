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
                "name": "add_calendar_event",
                "description": "新增行事曆活動。當使用者說「提醒我明天開會」、「幫我排行程」等明確有時間點的事件時使用。注意：如果是模糊的未來計畫（沒有具體時間），請改用 add_todo 或 context。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "title": {
                            "type": "string",
                            "description": "活動標題"
                        },
                        "start_time": {
                            "type": "string",
                            "description": "開始時間，格式必須為：YYYY/MM/DD HH:mm:ss。請根據對話上下文推算正確的日期與時間。"
                        },
                        "duration_hours": {
                            "type": "number",
                            "description": "持續時間（小時），預設為 1"
                        }
                    },
                    "required": ["title", "start_time"]
                }
            },
            {
                "name": "check_calendar",
                "description": "查詢接下來日曆上的行程。當使用者問「我有什麼行程」、「明天要幹嘛」時使用。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "days": {
                            "type": "number",
                            "description": "查詢未來幾天，預設 3"
                        }
                    }
                }
            },
            {
                "name": "get_weather",
                "description": "取得目前天氣資訊。當使用者問「天氣如何」、「會下雨嗎」時使用。重要：如果使用者沒有指定地點，請直接將 location 參數設為 '台北' 並執行，不要反問使用者，也不要因為不知道使用者的位置而不執行。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "城市名稱，預設為 '台北'。"
                        }
                    }
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

                case 'add_calendar_event':
                    return GoogleCalendar.createEvent(args.title, args.start_time, args.duration_hours);

                case 'check_calendar':
                    return GoogleCalendar.getUpcomingEvents(args.days);

                case 'get_weather':
                    var location = args.location || '台北';
                    var coords = {
                        "台北": { lat: 25.0330, lon: 121.5654 },
                        "新北": { lat: 25.0169, lon: 121.4627 },
                        "桃園": { lat: 24.9936, lon: 121.3009 },
                        "新竹": { lat: 24.8138, lon: 120.9674 },
                        "台中": { lat: 24.1477, lon: 120.6736 },
                        "嘉義": { lat: 23.4800, lon: 120.4491 },
                        "台南": { lat: 22.9997, lon: 120.2270 },
                        "高雄": { lat: 22.6272, lon: 120.3014 },
                        "基隆": { lat: 25.1276, lon: 121.7391 },
                        "宜蘭": { lat: 24.7517, lon: 121.7483 },
                        "花蓮": { lat: 23.9770, lon: 121.6022 },
                        "台東": { lat: 22.7662, lon: 121.1441 }
                    }[location];

                    if (!coords) {
                        // 預設台北
                        coords = { lat: 25.0330, lon: 121.5654 };
                        location += " (幫您查台北喔)";
                    }

                    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat + '&longitude=' + coords.lon + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&timezone=Asia%2FTaipei';

                    var response = UrlFetchApp.fetch(url);
                    var data = JSON.parse(response.getContentText());

                    if (!data.current) return '讀取天氣資料失敗～喵💔';

                    var current = data.current;
                    var weatherCode = current.weather_code;
                    var weatherText = "晴朗";

                    // 簡易 WMO Code 轉換
                    if (weatherCode === 0) weatherText = "晴天 ☀️";
                    else if (weatherCode <= 3) weatherText = "多雲 ☁️";
                    else if (weatherCode <= 48) weatherText = "有霧 🌫️";
                    else if (weatherCode <= 55) weatherText = "毛毛雨 🌧️";
                    else if (weatherCode <= 67) weatherText = "下雨 ☔";
                    else if (weatherCode <= 77) weatherText = "下雪 ❄️";
                    else if (weatherCode <= 82) weatherText = "陣雨 🌦️";
                    else if (weatherCode <= 99) weatherText = "雷雨 ⛈️";

                    return `【${location} 目前天氣】\n狀況：${weatherText}\n溫度：${current.temperature_2m}°C (體感 ${current.apparent_temperature}°C)\n濕度：${current.relative_humidity_2m}%\n降雨：${current.precipitation} mm`;

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
