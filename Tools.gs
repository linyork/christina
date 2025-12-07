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
                "name": "get_weather",
                "description": "取得天氣資訊。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "城市名稱 (預設: 台北)"
                        }
                    }
                }
            },
            {
                "name": "system_control",
                "description": "系統控制工具。包含：查詢ID、離開群組、清除記憶、取得梗圖。",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "action": {
                            "type": "string",
                            "enum": ["get_user_id", "leave_group", "clear_history", "get_meme"],
                            "description": "執行動作"
                        },
                        "meme_keyword": {
                            "type": "string",
                            "description": "梗圖關鍵字 (僅用於 get_meme)"
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
                        case 'get_meme':
                            var url = GoogleDrive.getImageUrl(args.meme_keyword + '.jpg');
                            return url ? ('找到梗圖了！連結：' + url) : '找不到這張梗圖QQ～喵嗚嗚💔';
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
                        "台東": { lat: 22.7662, lon: 121.1441 },
                        "澎湖": { lat: 23.5656, lon: 119.6151 },
                        "金門": { lat: 24.4364, lon: 118.3186 },
                        "馬祖": { lat: 26.1974, lon: 119.9687 }
                    }[location];

                    if (!coords) {
                        coords = { lat: 25.0330, lon: 121.5654 };
                        location += " (台北)";
                    }

                    var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat + '&longitude=' + coords.lon + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&timezone=Asia%2FTaipei';
                    var response = UrlFetchApp.fetch(url);
                    var data = JSON.parse(response.getContentText());

                    if (!data.current) return '讀取天氣資料失敗～喵💔';

                    var current = data.current;
                    var weatherCode = current.weather_code;
                    var weatherText = "晴朗";
                    if (weatherCode === 0) weatherText = "晴天 ☀️";
                    else if (weatherCode <= 3) weatherText = "多雲 ☁️";
                    else if (weatherCode <= 48) weatherText = "有霧 🌫️";
                    else if (weatherCode <= 55) weatherText = "毛毛雨 🌧️";
                    else if (weatherCode <= 67) weatherText = "下雨 ☔";
                    else if (weatherCode <= 77) weatherText = "下雪 ❄️";
                    else if (weatherCode <= 82) weatherText = "陣雨 🌦️";
                    else if (weatherCode <= 99) weatherText = "雷雨 ⛈️";

                    return `【${location} 目前天氣】\n狀況：${weatherText}\n溫度：${current.temperature_2m}°C (體感 ${current.apparent_temperature}°C)\n濕度：${current.relative_humidity_2m}%\n降雨：${current.precipitation} mm`;

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
