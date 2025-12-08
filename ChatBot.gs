/**
 * ChatBot
 * @description Gemini AI 整合模組 - 支援 Function Calling 與 RAG
 * @note 已重構：API 呼叫移至 GeminiService，歷史管理移至 HistoryManager，記憶邏輯移至 Mind
 */
var ChatBot = (() => {
    var chatBot = {};

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

            // 2. 建構 Gemini Request
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

            // 呼叫 GeminiService
            var data = GeminiService.callAPI(contents);

            if (data && data.candidates && data.candidates[0].content) {
                var rawText = data.candidates[0].content.parts[0].text;

                // 3. 解析回應
                var desc = "";
                var reply = "";

                var parts = rawText.split("[REPLY]");
                if (parts.length === 2) {
                    desc = parts[0].replace("[DESC]", "").trim();
                    reply = parts[1].trim();
                } else {
                    reply = rawText.replace("[DESC]", "").replace("[REPLY]", "").trim();
                    desc = "一張圖片 (AI 解析失敗)";
                }

                // 4. 存入記憶
                var memoryContent = `[傳送了一張圖片] 內容：${desc}`;
                HistoryManager.saveMessage(userId, 'user', memoryContent);
                HistoryManager.saveMessage(userId, 'assistant', reply);

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

            // 取得對話歷史
            var userHistory = HistoryManager.getUserHistory(userId, Config.CHAT_MAX_TURNS);

            // 建立完整的對話內容
            var contents = [];

            // 判斷使用者身分並設定對應的系統指令
            var userIdentity = event.isMaster ? "主人 (Master)" : "訪客 (Guest)";
            var roleInstruction = event.isMaster ? "現在是主人的請求，請盡力協助。" : "現在是訪客 (Guest) 的請求。請禮貌地拒絕提供任何服務或功能，並說明您只專屬於主人。不要執行任何 Function Call。";

            // 取得短期記憶 context
            var shortTermMemories = GoogleSheet.getValidShortTermMemories();
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
                userStateInfo +
                "\nInstruction: " + roleInstruction;

            contextInfo += "\n\n[Time Awareness Instructions]\n" +
                "請特別注意對話中的時間標籤 [YYYY/MM/DD HH:mm:ss]。\n" +
                "1. 如果發現上一則對話與現在時間相隔較久（例如超過6小時），請適度表達關心。\n" +
                "2. 如果時間是連續的，則正常回應即可。\n" +
                "3. 如果時間與你的虛擬生活衝突（例如現在是深夜），請表現出符合時間的反應。";

            if (shortTermMemories) {
                contextInfo += "\n\n[Current Context / Short Term Memories]:\n" + shortTermMemories;
            }

            // 加入系統提示
            contents.push({
                "role": "user",
                "parts": [{ "text": Config.CHAT_SYSTEM_PROMPT + "\n\n" + Config.MIND_SYSTEM_PROMPT + "\n\n" + contextInfo }]
            });
            contents.push({
                "role": "model",
                "parts": [{ "text": "好的，我是 Christina～喵❤️ 我了解了！" }]
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

            // 多輪對話迴圈
            var maxTurns = 5;
            var finalResponse = '';

            for (var turn = 0; turn < maxTurns; turn++) {
                // 呼叫 GeminiService
                var data = GeminiService.callAPI(contents, toolDefinitions);

                if (!data || !data.candidates || !data.candidates[0]) {
                    GoogleSheet.logError('ChatBot.reply', 'Invalid response format', data);
                    return '主人不好意思我有點混亂～喵💔';
                }

                var candidate = data.candidates[0];
                var content = candidate.content;

                if (!content || !content.parts || content.parts.length === 0) {
                    GoogleSheet.logInfo('ChatBot.reply', 'No content in response. FinishReason: ' + (candidate.finishReason || 'Unknown'));
                    return null;
                }

                var part = content.parts[0];

                // 檢查 Function Call
                if (part.functionCall) {
                    var functionCall = part.functionCall;
                    var functionName = functionCall.name;
                    var functionArgs = functionCall.args || {};

                    GoogleSheet.logInfo('ChatBot.reply', 'Function call: ' + functionName);

                    // 執行工具
                    var functionResult = Tools.execute(functionName, functionArgs, event);

                    // 將結果加入對話
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
                    continue;
                }

                // 文字回應 (Shadow Thinking parsing)
                if (part.text) {
                    var rawText = part.text;
                    try {
                        // 1. 嘗試清理 Markdown
                        var cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

                        // 2. 嘗試抓取 JSON 範圍
                        var jsonMatch = cleanText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            cleanText = jsonMatch[0];
                        }

                        // 3. 嘗試解析
                        var jsonObj;
                        try {
                            // 先嘗試正規解析
                            jsonObj = JSON.parse(cleanText);
                        } catch (e1) {
                            // 解析失敗 (通常是 Bad control character)
                            GoogleSheet.logInfo('ChatBot.reply', 'Standard JSON parse failed, trying Regex fallback. Error:', e1.message);

                            // 備用方案：使用 Regex 硬抓 reply 內容
                            // 這能避開字串內未跳脫的換行符號問題，且支援跨行匹配
                            var replyMatch = cleanText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.|[\r\n])*)"/);
                            if (replyMatch && replyMatch[1]) {
                                // 抓到了！還原跳脫字元
                                finalResponse = replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');

                                // 順便試試看抓 analysis (非必要)
                                try {
                                    // 簡單抓取 analysis 物件 (假設它是最後一個)
                                    var analysisIndex = cleanText.lastIndexOf('"analysis"');
                                    if (analysisIndex !== -1) {
                                        var analysisText = cleanText.substring(analysisIndex);
                                        // 這裡很難用 regex 精準抓到結尾，暫時放棄 analysis，保住 reply 最重要
                                        // 或是簡單的 regex
                                        var analysisMatch = analysisText.match(/"analysis"\s*:\s*(\{[\s\S]*?\})\s*\}/);
                                        if (analysisMatch) {
                                            Mind.processAnalysis(userId, JSON.parse(analysisMatch[1]));
                                        }
                                    }
                                } catch (e2) {
                                    GoogleSheet.logInfo('ChatBot.reply', 'Analysis regex fallback failed (non-critical). Error:', e2.message);
                                }

                                // 跳出迴圈，因為我們已經手動解析成功了
                                break;
                            } else {
                                throw e1; // Regex 也抓不到，只好拋出錯誤
                            }
                        }

                        if (jsonObj && jsonObj.reply) {
                            finalResponse = jsonObj.reply;
                            if (jsonObj.analysis) {
                                Mind.processAnalysis(userId, jsonObj.analysis);
                            }
                        } else {
                            finalResponse = rawText;
                        }
                    } catch (e) {
                        // JSON 解析失敗
                        finalResponse = rawText;
                        GoogleSheet.logInfo('ChatBot.reply', 'JSON Parse Failed: ' + e.message + ' | Raw: ' + rawText.substring(0, 50) + '...');
                    }
                    break;
                }
                break;
            }

            if (!finalResponse) {
                return '主人不好意思我有點混亂～喵💔';
            }

            // 儲存對話
            HistoryManager.saveMessage(userId, 'user', message);
            HistoryManager.saveMessage(userId, 'assistant', finalResponse);

            return finalResponse;
        } catch (error) {
            GoogleSheet.logError('ChatBot.reply', error);
            return '主人不好意思我有點混亂～喵💔';
        }
    };

    /**
     * 生成主動問候語
     * @param {string} instruction
     * @returns {string}
     */
    chatBot.generateGreeting = (instruction) => {
        try {
            var prompt = Config.CHAT_SYSTEM_PROMPT + "\n\n[System Instruction]\n" + instruction;
            var promptContents = [{ "role": "user", "parts": [{ "text": prompt }] }];

            var data = GeminiService.callAPI(promptContents);

            if (data && data.candidates && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            }
            return "主人～休息時間到了喔！起來走走吧～喵❤️";
        } catch (ex) {
            GoogleSheet.logError('ChatBot.generateGreeting', ex);
            return "主人～休息時間到了喔！起來走走吧～喵❤️";
        }
    };

    /**
     * 決定是否主動發送訊息
     */
    chatBot.decideProactiveMessage = (userId, hoursSinceLastChat) => {
        try {
            var knowledge = GoogleSheet.searchKnowledge(Config.PROACTIVE_SEARCH_QUERY);
            var shortTermMemories = GoogleSheet.getValidShortTermMemories();

            var now = new Date();
            var hour = now.getHours();
            var nowStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            var timePeriod = "";
            if (hour >= 6 && hour < 9) timePeriod = "早晨";
            else if (hour >= 9 && hour < 12) timePeriod = "上午";
            else if (hour >= 12 && hour < 14) timePeriod = "中午";
            else if (hour >= 14 && hour < 18) timePeriod = "下午";
            else if (hour >= 18 && hour < 23) timePeriod = "晚上";
            else timePeriod = "深夜";

            // [Optimization] 抓取最近 6 則真實對話
            var recentHistoryObjs = HistoryManager.getUserHistory(userId, 6);
            
            // ==========================================
            // Logic Branching: 判斷發話情境 (Context Mode)
            // ==========================================
            var lastRole = 'unknown';
            var recentHistoryStr = "無 (很久沒說話了)";
            
            if (recentHistoryObjs && recentHistoryObjs.length > 0) {
                // 1. 轉換歷史紀錄格式
                recentHistoryStr = recentHistoryObjs.map(h => {
                     var roleName = (h.role === 'user') ? '主人' : 'Christina';
                     var txt = (h.parts && h.parts[0]) ? h.parts[0].text : "";
                     return `${roleName}: ${txt}`;
                }).join("\n");
                
                // 2. 取得最後一句話是誰說的
                var lastObj = recentHistoryObjs[recentHistoryObjs.length - 1];
                lastRole = lastObj.role; // 'user' or 'model'
            }

            // 3. 程式邏輯決定「模式指令 (Mode Instruction)」
            var modeInstruction = "";
            
            if (hoursSinceLastChat < 2.0) {
                // --- 短期熱聊模式 (< 2小時) ---
                if (lastRole === 'model') {
                    // 情境 A: 上一句是 AI 說的 -> 自我追加 (Self Follow-up)
                    modeInstruction = `
【當前模式：追加補充 (Self Follow-up)】
狀況：你剛剛才回覆過主人 (見上方紀錄)，現在又要主動傳訊息。
限制：
1. **絕對禁止** 打招呼 (午安、歡迎回來、在嗎)，因為你才剛講完話。
2. 請用「對了...」、「還有...」、「突然想到...」這種語氣，直接補充你想說的新資訊。
3. 就像你話講到一半突然想補充一樣。`;
                } else {
                    // 情境 B: 上一句是 User 說的 -> 延遲回應 (Delayed Reply)
                    modeInstruction = `
【當前模式：延遲回應 (Delayed Reply)】
狀況：主人上一句話剛說完不久，但我們還沒回覆 (或正在思考)。
限制：
1. **不要** 把它當成新對話，請直接針對主人的上一句話進行回應。
2. 不需要再說「歡迎回來」，直接回覆內容即可。`;
                }
            } else {
                // --- 長期閒置模式 (> 2小時) ---
                // 情境 C: 新對話 (New Session)
                modeInstruction = `
【當前模式：發起新對話 (New Session)】
狀況：我們已經有一段時間沒說話了。
限制：
1. 可以依據當時時間 (早安/午安/晚安) 進行自然開場。
2. 嘗試用一個新的話題吸引主人注意。`;
            }

            var contextPrompt = `
[情境模擬]
現在時間：${nowStr} (${timePeriod})
距離上次對話：約 ${hoursSinceLastChat.toFixed(1)} 小時

[最近真實對話紀錄 (Ref-Check)]:
${recentHistoryStr}

[關於主人的知識]:
${knowledge}

[短期記憶 (摘要)]:
${shortTermMemories || "無"}

${modeInstruction}

[你的虛擬生活]
你是 Christina，請根據現在的時間，想像這幾個小時你剛剛在做什麼？
核心動機：填補對主人的認知空白 (Knowledge Gap) 或 驗證主人的行為模式。

[決策任務]
請綜合以上模式與資訊，判斷是否要發送訊息？
- 保持安靜 -> "SILENT"
- 主動開口 -> 直接依照【當前模式】的限制回傳內容（不需要 JSON）。`;

            var contents = [
                { "role": "user", "parts": [{ "text": Config.CHAT_SYSTEM_PROMPT + "\n\n" + contextPrompt }] }
            ];

            var data = GeminiService.callAPI(contents);

            if (data && data.candidates && data.candidates[0].content) {
                var responseText = data.candidates[0].content.parts[0].text.trim();

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
