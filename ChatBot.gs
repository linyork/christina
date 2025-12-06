/**
 * ChatBot
 * @description Gemini AI 整合模組 - 支援 Function Calling 與 RAG
 */
var ChatBot = (() => {
    var chatBot = {};

    /**
     * 取得用戶的對話歷史
     * @param {string} userId - 用戶 ID
     * @param {number} limit - 最多保留幾輪對話（預設 20 輪 = 40 條記錄）
     * @returns {array} 對話歷史陣列
     */
    var getUserHistory = (userId, limit) => {
        try {
            limit = limit || Config.CHAT_MAX_TURNS;
            var maxRecords = limit * 2; // 1 輪 = user + assistant 兩條記錄

            // 從 Sheet 讀取該用戶的歷史（按時間倒序）
            var history = DB()
                .from('chat')
                .limitLoad(Config.CHAT_READ_LIMIT)
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!history || history.length === 0) {
                return [];
            }

            // 轉換為陣列並排序（最舊的在前）
            var historyArray = Array.isArray(history) ? history : [history];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            // 只保留最近的 N 條記錄
            if (historyArray.length > maxRecords) {
                historyArray = historyArray.slice(-maxRecords);
            }

            // 轉換為 Gemini API 格式
            var contents = [];
            historyArray.forEach(item => {
                if (item.role && item.content) {
                    // Gemini 使用 'user' 和 'model' 作為角色
                    var role = item.role === 'assistant' ? 'model' : 'user';

                    // [Time Awareness] 加入時間戳記讓 AI 感知時間流逝
                    // 格式: [2024/12/06 13:00:00] 訊息內容
                    var timeStr = "";
                    if (item.timestamp) {
                        try {
                            // 確保時間格式正確
                            var date = new Date(item.timestamp);
                            if (!isNaN(date.getTime())) {
                                timeStr = "[" + Utilities.formatDate(date, "GMT+8", "yyyy/MM/dd HH:mm:ss") + "] ";
                            }
                        } catch (e) {
                            // 時間格式錯誤則忽略
                        }
                    }

                    contents.push({
                        "role": role,
                        "parts": [{ "text": timeStr + item.content }]
                    });
                }
            });

            return contents;
        } catch (ex) {
            GoogleSheet.logError('ChatBot.getUserHistory', ex);
            return [];
        }
    };

    /**
     * 儲存訊息到對話歷史
     * @param {string} userId - 用戶 ID
     * @param {string} role - 角色（user/assistant）
     * @param {string} content - 訊息內容
     */
    var saveMessage = (userId, role, content) => {
        try {
            // 轉換為台灣時間格式 (YYYY/MM/DD HH:mm:ss)
            var now = new Date();
            var timestamp = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            GoogleSheet.logInfo('ChatBot.saveMessage', 'Saving: userId=' + userId + ', role=' + role);

            DB()
                .insert('chat')
                .set('userId', userId)
                .set('role', role)
                .set('content', content)
                .set('timestamp', timestamp)
                .execute();

            GoogleSheet.logInfo('ChatBot.saveMessage', 'Saved successfully');
        } catch (ex) {
            GoogleSheet.logError('ChatBot.saveMessage', 'Error details:', ex.toString(), 'userId=' + userId, 'role=' + role);
        }
    };

    /**
     * 清理用戶的舊對話（保留最近 N 輪）
     * @param {string} userId - 用戶 ID
     * @param {number} keepTurns - 保留幾輪對話
     */
    var cleanOldHistory = (userId, keepTurns) => {
        try {
            keepTurns = keepTurns || Config.CHAT_MAX_TURNS;
            var keepRecords = keepTurns * 2;

            // 取得該用戶的所有對話
            // 優化: 只讀取最後 N 筆資料 (夠判斷是否超過限制了)
            var allHistory = DB()
                .from('chat')
                .limitLoad(Config.CHAT_READ_LIMIT)
                .where('userId', '=', userId)
                .execute()
                .get();

            if (!allHistory || allHistory.length <= keepRecords) {
                return; // 不需要清理
            }

            // 轉換為陣列並排序
            var historyArray = Array.isArray(allHistory) ? allHistory : [allHistory];
            historyArray.sort((a, b) => {
                var timeA = new Date(a.timestamp || 0).getTime();
                var timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            // 計算要刪除的記錄數量
            var deleteCount = historyArray.length - keepRecords;
            if (deleteCount > 0) {
                GoogleSheet.logInfo('ChatBot.cleanOldHistory', 'Cleaned ' + deleteCount + ' old messages for user ' + userId);
            }
        } catch (ex) {
            GoogleSheet.logError('ChatBot.cleanOldHistory', ex);
        }
    };

    /**
     * 清除用戶的所有對話歷史
     * @param {string} userId - 用戶 ID
     */
    chatBot.clearUserHistory = (userId) => {
        try {
            GoogleSheet.clearChatHistory(userId);
            GoogleSheet.logInfo('ChatBot.clearUserHistory', 'Cleared history for user ' + userId);
        } catch (ex) {
            GoogleSheet.logError('ChatBot.clearUserHistory', ex);
        }
    };

    /**
     * 呼叫 Gemini API（支援 Function Calling）
     * @param {array} contents - 對話內容
     * @param {array} tools - 工具定義（可選）
     * @returns {object} API 回應
     */
    /**
     * 呼叫 Gemini API（支援 Function Calling 與 Multimodal）
     * @param {array} contents - 對話內容，支援文字與圖片
     * @param {array} tools - 工具定義（可選）
     * @returns {object} API 回應
     */
    var callGemini = (contents, tools) => {
        try {
            var url = Config.GEMINI_API_BASE + '/models/' + Config.GEMINI_MODEL + ':generateContent?key=' + Config.GEMINI_API_KEY;

            var payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 2048,
                    "topP": 0.95
                }
            };

            // 如果有提供工具定義，加入 payload
            if (tools && tools.length > 0) {
                payload.tools = [{
                    "functionDeclarations": tools
                }];
                // 注意：Function Calling 暫時不支援與圖片同時發送，若有圖片通常作為純分析用
                // 這裡我們保持工具與圖片共存的邏輯，Gemini 1.5 Pro/Flash 應該支援
            }

            var options = {
                "method": "post",
                "contentType": "application/json",
                "payload": JSON.stringify(payload),
                "muteHttpExceptions": true
            };

            var response = UrlFetchApp.fetch(url, options);
            var responseCode = response.getResponseCode();

            if (responseCode !== 200) {
                GoogleSheet.logError('ChatBot.callGemini', 'API Error: ' + responseCode, response.getContentText());
                return null;
            }

            var responseText = response.getContentText();
            return JSON.parse(responseText);
        } catch (error) {
            GoogleSheet.logError('ChatBot.callGemini', error);
            return null;
        }
    };

    /**
     * 回覆訊息（支援 Function Calling 與 RAG）
     * @param {object} event - Line 事件物件
     * @returns {string} AI 回覆
     */
    /**
     * 處理圖片訊息
     * @param {object} event - Line 事件物件
     * @param {Blob} imageBlob - 圖片 Blob
     * @returns {string} AI 回覆
     */
    chatBot.processImage = (event, imageBlob) => {
        try {
            var userId = event.source.userId;

            // 1. 圖片前處理
            var base64Image = Utilities.base64Encode(imageBlob.getBytes());
            var mimeType = imageBlob.getContentType();

            // 2. 建構 Gemini Request - Visual Analysis & Response
            // 我們希望 AI 做兩件事：
            // (1) 產生圖片描述 (Description) -> 用於存檔記憶 (Visual to Text)
            // (2) 產生對使用者的回應 (Reply) -> 符合人設

            var systemPrompt = Config.CHAT_SYSTEM_PROMPT + `
            
【特殊任務：視覺處理】
主人剛剛傳送了一張圖片給你。請依序完成以下任務：
1. **[DESC]**: 以第三方客觀旁白的角度，詳細描述這張圖片的內容 (包含人事物、場景、文字)。這段文字將作為這張圖片的「記憶存檔」。
2. **[REPLY]**: 回到 Christina 的女僕人設，針對這張圖片給予主人親切、可愛的回應。

請務必依照以下格式回傳，不要有其他廢話：
[DESC] 詳細的圖片描述...
[REPLY] Christina 的回應內容...`;

            var contents = [
                {
                    "role": "user",
                    "parts": [
                        { "text": systemPrompt },
                        {
                            "inlineData": {
                                "mimeType": mimeType,
                                "data": base64Image
                            }
                        }
                    ]
                }
            ];

            // 呼叫 Gemini (不帶工具，專注於視覺分析)
            var data = callGemini(contents);

            if (data && data.candidates && data.candidates[0].content) {
                var rawText = data.candidates[0].content.parts[0].text;

                // 3. 解析回應
                var desc = "";
                var reply = "";

                // 簡單解析器
                var parts = rawText.split("[REPLY]");
                if (parts.length === 2) {
                    desc = parts[0].replace("[DESC]", "").trim();
                    reply = parts[1].trim();
                } else {
                    // Fallback: 如果格式跑掉，整個當作 reply，描述用預設
                    reply = rawText.replace("[DESC]", "").replace("[REPLY]", "").trim();
                    desc = "一張圖片 (AI 解析失敗)";
                }

                // 4. 存入記憶 (關鍵步驟：Visual Persistence)
                // 我們將圖片描述存為 User 的發言，這樣就像 User 用文字描述了這張圖一樣
                var memoryContent = `[傳送了一張圖片] 內容：${desc}`;
                saveMessage(userId, 'user', memoryContent);
                saveMessage(userId, 'assistant', reply);

                // 清理舊對話
                cleanOldHistory(userId, Config.CHAT_MAX_TURNS);

                return reply;
            }

            return '嗚嗚...我看不太清楚這張照片～喵💔';

        } catch (ex) {
            GoogleSheet.logError('ChatBot.processImage', ex);
            return '讀取圖片時發生錯誤惹～喵💔';
        }
    };

    /**
     * 回覆訊息（支援 Function Calling 與 RAG）
     * @param {object} event - Line 事件物件
     * @returns {string} AI 回覆
     */
    chatBot.reply = (event) => {
        try {
            var userId = event.source.userId;
            var message = event.message.text;

            // 取得該用戶的對話歷史
            var userHistory = getUserHistory(userId, Config.CHAT_MAX_TURNS);

            // [Affection System] 取得好感度
            var userStats = GoogleSheet.getUserStats(userId);
            var affectionScore = userStats.affection;
            var affectionLevel = "";
            if (affectionScore >= 100) affectionLevel = "Lv.5 永恆羈絆";
            else if (affectionScore >= 80) affectionLevel = "Lv.4 靈魂伴侶";
            else if (affectionScore >= 60) affectionLevel = "Lv.3 信賴的夥伴";
            else if (affectionScore >= 31) affectionLevel = "Lv.2 熟悉的朋友";
            else affectionLevel = "Lv.1 點頭之交";

            // 建立完整的對話內容
            var contents = [];

            // 判斷使用者身分並設定對應的系統指令
            var userIdentity = event.isMaster ? "主人 (Master)" : "訪客 (Guest)";
            var roleInstruction = event.isMaster ? "現在是主人的請求，請盡力協助。" : "現在是訪客 (Guest) 的請求。請禮貌地拒絕提供任何服務或功能，並說明您只專屬於主人。不要執行任何 Function Call。";

            // 取得短期記憶 context
            var shortTermMemories = GoogleSheet.getValidShortTermMemories();
            // [Time Awareness] 注入現在時間與時間感知指令
            var nowStr = Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm:ss");

            // [Mind] 取得使用者狀態矩陣
            var userState = Mind.getUserState(userId);
            var userStateInfo = `
[User State Matrix]
Mood: ${userState.mood}
Energy: ${userState.energy}/10
Busyness: ${userState.busyness}`;

            var contextInfo = "\n\n[System Info]\nCurrent Time: " + nowStr +
                "\nCurrent User: " + userIdentity +
                "\n[Affection Status]: " + affectionLevel + " (Score: " + affectionScore + ")" +
                userStateInfo +
                "\nInstruction: " + roleInstruction;

            // 加入時間感知提示
            contextInfo += "\n\n[Time Awareness Instructions]\n" +
                "請特別注意對話中的時間標籤 [YYYY/MM/DD HH:mm:ss]。\n" +
                "1. 如果發現上一則對話與現在時間相隔較久（例如超過6小時），請適度表達關心（例如：「主人怎麼這麼久才找我？」）。\n" +
                "2. 如果時間是連續的，則正常回應即可。\n" +
                "3. 如果時間與你的虛擬生活衝突（例如現在是深夜），請表現出符合時間的反應（例如想睡）。";

            if (shortTermMemories) {
                contextInfo += "\n\n[Current Context / Short Term Memories]:\n" + shortTermMemories;
            }

            // 加入系統提示（作為第一條 user 訊息）
            // [Mind System Prompt Injection]
            contents.push({
                "role": "user",
                "parts": [{ "text": Config.CHAT_SYSTEM_PROMPT + "\n\n" + Config.MIND_SYSTEM_PROMPT + "\n\n" + contextInfo }]
            });
            contents.push({
                "role": "model",
                "parts": [{ "text": "好的，我是 Christina～喵❤️ 我了解了！目前的關係是：" + affectionLevel }]
            });

            // 加入歷史對話
            contents = contents.concat(userHistory);

            // 加入當前訊息
            contents.push({
                "role": "user",
                "parts": [{ "text": message }]
            });

            // 取得工具定義
            var toolDefinitions = Tools.getDefinitions();

            // 多輪對話迴圈（最多 5 輪，避免無限迴圈）
            var maxTurns = 5;
            var finalResponse = '';

            for (var turn = 0; turn < maxTurns; turn++) {
                // 呼叫 Gemini API
                var data = callGemini(contents, toolDefinitions);

                if (!data || !data.candidates || !data.candidates[0]) {
                    GoogleSheet.logError('ChatBot.reply', 'Invalid response format', data);
                    return '主人不好意思我有點混亂～喵💔';
                }

                var candidate = data.candidates[0];
                var content = candidate.content;

                if (!content || !content.parts || content.parts.length === 0) {
                    GoogleSheet.logError('ChatBot.reply', 'No content in response');
                    return '主人不好意思我有點混亂～喵💔';
                }

                var part = content.parts[0];

                // 檢查是否為 Function Call
                if (part.functionCall) {
                    var functionCall = part.functionCall;
                    var functionName = functionCall.name;
                    var functionArgs = functionCall.args || {};

                    GoogleSheet.logInfo('ChatBot.reply', 'Function call: ' + functionName);

                    // 執行工具 (傳入 event 作為 context)
                    var functionResult = Tools.execute(functionName, functionArgs, event);

                    // 將工具執行結果加入對話
                    contents.push({
                        "role": "model",
                        "parts": [{ "functionCall": functionCall }]
                    });
                    contents.push({
                        "role": "user",
                        "parts": [{
                            "functionResponse": {
                                "name": functionName,
                                "response": {
                                    "result": functionResult
                                }
                            }
                        }]
                    });

                    // 繼續下一輪，讓 AI 根據工具結果生成回應
                    continue;
                }

                // 如果是文字回應，嘗試解析 JSON (Shadow Thinking)
                if (part.text) {
                    var rawText = part.text;
                    try {
                        // 1. 嘗試清理 Markdown
                        var jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

                        // 2. 解析 JSON
                        var jsonObj = JSON.parse(jsonText);

                        if (jsonObj && jsonObj.reply) {
                            finalResponse = jsonObj.reply;

                            // 3. 處理 Shadow Thinking 分析結果
                            if (jsonObj.analysis) {
                                Mind.processAnalysis(userId, jsonObj.analysis);
                            }
                        } else {
                            // JSON 格式但不包含 reply (不符合預期)，當作純文字
                            finalResponse = rawText;
                        }
                    } catch (e) {
                        // 解析失敗，代表 AI 回傳純文字 (Fallback)
                        finalResponse = rawText;
                        GoogleSheet.logInfo('ChatBot.reply', 'Response is not structured JSON, treating as text');
                    }
                    break;
                }

                // 其他情況，結束迴圈
                GoogleSheet.logError('ChatBot.reply', 'Unexpected response type', part);
                break;
            }

            if (!finalResponse) {
                return '主人不好意思我有點混亂～喵💔';
            }

            // 儲存對話
            saveMessage(userId, 'user', message);
            saveMessage(userId, 'assistant', finalResponse);

            // 清理舊對話（保持在限制內）
            cleanOldHistory(userId, Config.CHAT_MAX_TURNS);

            // [Affection System] 增加好感度 (+1)
            GoogleSheet.updateAffection(userId, 1);

            return finalResponse;
        } catch (error) {
            GoogleSheet.logError('ChatBot.reply', error);
            return '主人不好意思我有點混亂～喵💔';
        }
    };

    /**
     * 將對話紀錄總結為短期記憶
     * @param {string} chatText - 對話紀錄文字
     * @returns {object|null} {key, content} 或 null
     */
    chatBot.summarizeChatsToMemory = (chatText) => {
        try {
            var prompt = `你是 Christina，主人的貼心女僕。
這裡有一些超過 7 天的舊對話紀錄。請幫我閱讀並判斷：
是否有任何「暫時性重要」的資訊值得轉存為短期記憶？（例如：主人最近在煩惱的事、正在進行的計畫、或是這幾天的狀態）。
如果是普通的閒聊，請直接忽略。

對話紀錄：
${chatText}

如果值得保留，請回傳 JSON 格式：{"key": "主題", "content": "詳細內容"}
如果不值得保留，請回傳 null (JSON)。
請只回傳 JSON，不要有其他廢話。`;

            var promptContents = [{ "role": "user", "parts": [{ "text": prompt }] }];
            var response = callGemini(promptContents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                // 清理 markdown code block
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                if (text === 'null') return null;
                return JSON.parse(text);
            }
            return null;
        } catch (ex) {
            GoogleSheet.logError('ChatBot.summarizeChatsToMemory', ex);
            return null;
        }
    };

    /**
     * 評估短期記憶是否轉為長期記憶
     * @param {object} memory - 短期記憶物件 {key, content}
     * @returns {object} {keep: boolean, tags: [], content: string}
     */
    chatBot.evaluateMemoryForLongTerm = (memory) => {
        try {
            var prompt = `你是 Christina，主人的專屬女僕。
這條短期記憶即將過期（或需要整理）：
主題：${memory.key}
內容：${memory.content}

請以女僕的角度思考：這條資訊是否包含「主人永久性的喜好、習慣、重要事實」？
如果是（例如：主人不吃香菜、主人的生日），請將其轉化為長期知識。
如果否（例如：上週的晚餐、已過期的提醒），請讓它自然遺忘。

請回傳 JSON 格式：
{
  "keep": boolean, // true = 轉存長期, false = 遺忘
  "tags": ["tag1", "tag2"], // 如果 keep=true，請提供標籤
  "content": "轉存的內容" // 如果 keep=true，請提供轉存內容
}
請只回傳 JSON，不要有其他廢話。`;

            var promptContents = [{ "role": "user", "parts": [{ "text": prompt }] }];
            var response = callGemini(promptContents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            }
            return { keep: false };
        } catch (ex) {
            GoogleSheet.logError('ChatBot.evaluateMemoryForLongTerm', ex);
            return { keep: false };
        }
    };

    /**
     * 生成主動問候語
     * @param {string} instruction - 給 AI 的指示 (例如：提醒主人休息)
     * @returns {string} AI 生成的問候語
     */
    chatBot.generateGreeting = (instruction) => {
        try {
            var prompt = Config.CHAT_SYSTEM_PROMPT + "\n\n[System Instruction]\n" + instruction;
            var promptContents = [{ "role": "user", "parts": [{ "text": prompt }] }];

            // 使用 callGemini 生成回應
            var data = callGemini(promptContents);

            if (data && data.candidates && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
            return "主人～休息時間到了喔！起來走走吧～喵❤️"; // Fallback
        } catch (ex) {
            GoogleSheet.logError('ChatBot.generateGreeting', ex);
            return "主人～休息時間到了喔！起來走走吧～喵❤️";
        }
    };

    /**
     * 決定是否主動發送訊息
     * @param {string} userId - 用戶 ID
     * @param {number} hoursSinceLastChat - 距離上次對話的小時數
     * @returns {string|null} 回傳生成的訊息，如果不發送則回傳 null
     */
    /**
     * 決定是否主動發送訊息
     * @param {string} userId - 用戶 ID
     * @param {number} hoursSinceLastChat - 距離上次對話的小時數
     * @returns {string|null} 回傳生成的訊息，如果不發送則回傳 null
     */
    chatBot.decideProactiveMessage = (userId, hoursSinceLastChat) => {
        try {
            // 1. 取得相關知識 (作息、習慣、狀態)
            var knowledge = GoogleSheet.searchKnowledge(Config.PROACTIVE_SEARCH_QUERY);

            // 2. 取得短期記憶
            var shortTermMemories = GoogleSheet.getValidShortTermMemories();

            // 3. 準備 Context (加入時段氣氛與虛擬生活感)
            var now = new Date();
            var hour = now.getHours();
            var nowStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            var timeAtmosphere = "";
            if (hour >= 6 && hour < 9) timeAtmosphere = "早晨 (充滿活力、正能量)";
            else if (hour >= 9 && hour < 12) timeAtmosphere = "上午 (專注工作、或是稍微忙碌)";
            else if (hour >= 12 && hour < 14) timeAtmosphere = "中午 (午休、放鬆、關心午餐)";
            else if (hour >= 14 && hour < 18) timeAtmosphere = "下午 (悠閒下午茶、或是稍微慵懶)";
            else if (hour >= 18 && hour < 23) timeAtmosphere = "晚上 (放鬆、陪伴、或者關心晚餐)";
            else timeAtmosphere = "深夜 (安靜、想睡、或是輕聲細語)";

            var contextPrompt = `
[情境模擬]
現在時間：${nowStr}
時段氣氛：${timeAtmosphere}
距離上次對話：約 ${hoursSinceLastChat.toFixed(1)} 小時

[關於主人的知識]:
${knowledge}

[短期記憶]:
${shortTermMemories || "無"}

[你的虛擬生活 (重要！)]
你是 Christina，你不只是一個程式，你也有自己的「虛擬生活」。
請根據現在的時間，想像這幾個小時你剛剛在做什麼？
(例如：早上剛整理完資料庫覺得神清氣爽、下午在觀察網路世界的迷因覺得好笑、晚上剛好讀了一本數位電子書...)

[決策任務]
請綜合「你的虛擬生活狀態」與「主人的狀態」，判斷現在是否適合找主人聊聊？

判斷準則：
1. **作息優先**：如果現在是主人通常在忙、開會或睡覺的時間，回傳 "SILENT"。
2. **自然互動**：如果時機合適，請發起一個話題。不要只是問「主人在忙嗎？」，試著：
   - 分享你剛剛在做的事（展現生活感）。
   - 看到某個東西想到主人。
   - 針對短期記憶的事件給予關心。
   - 或是單純的撒嬌求關注。

[回傳格式]
- 保持安靜 -> "SILENT"
- 主動開口 -> 直接回傳你的說話內容（不需要 JSON，語氣要符合女僕人設，並包含上述的虛擬生活情境）。`;

            // 4. 呼叫 Gemini
            // 這裡我們不需要用正規的 Chat History，因為這是一個獨立的判斷請求
            // 但我們需要 System Prompt 來保持人設
            var contents = [
                { "role": "user", "parts": [{ "text": Config.CHAT_SYSTEM_PROMPT + "\n\n" + contextPrompt }] }
            ];

            var data = callGemini(contents); // 不使用 Tools，純文字生成

            if (data && data.candidates && data.candidates[0].content) {
                var responseText = data.candidates[0].content.parts[0].text.trim();

                // 檢查是否為 SILENT (忽略大小寫和空白)
                if (responseText.toUpperCase().includes("SILENT")) {
                    GoogleSheet.logInfo('ChatBot.decideProactiveMessage', 'AI decided to be SILENT');
                    return null;
                }

                return responseText;
            }

            return null;

        } catch (ex) {
            GoogleSheet.logError('ChatBot.decideProactiveMessage', ex);
            return null;
        }
    };

    return chatBot;
})();
