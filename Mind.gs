/**
 * Mind
 * @description Christina 的核心大腦 - 負責思考、情緒感知與行為預判
 * 包含：Shadow Thinking (影子思考), State Matrix (狀態矩陣), Pattern Engine (行為模式)
 */
var Mind = (() => {
    var mind = {};

    // ==========================================
    // Part 1: State Matrix (狀態矩陣)
    // ==========================================

    /**
     * 取得使用者的當前心理狀態
     * @param {string} userId
     * @returns {object} { mood, energy, busyness, last_topic, timestamp }
     */
    mind.getUserState = (userId) => {
        try {
            return GoogleSheet.getUserMatrix(userId);
        } catch (ex) {
            GoogleSheet.logError('Mind.getUserState', ex);
            // 回傳預設平靜狀態
            return {
                mood: 'calm',
                energy: 5,
                busyness: 'normal',
                last_topic: '',
                timestamp: new Date()
            };
        }
    };

    /**
     * 更新使用者的心理狀態
     * @param {string} userId
     * @param {object} stateUpdates - 要更新的狀態欄位 (部分更新)
     */
    mind.updateUserState = (userId, stateUpdates) => {
        try {
            GoogleSheet.updateUserMatrix(userId, stateUpdates);
        } catch (ex) {
            GoogleSheet.logError('Mind.updateUserState', ex);
        }
    };

    // ==========================================
    // Part 2: Shadow Thinking (影子思考)
    // ==========================================

    /**
     * 處理影子思考的分析結果 (由 ChatBot 非同步呼叫)
     * @param {string} userId
     * @param {object} analysis - LLM 產生的分析物件
     * 結構: {
     *   sentiment: "happy" | "neutral" | "sad" | "angry" | "anxious",
     *   energy_level: 1-10,
     *   intent: "chat" | "work" | "command",
     *   facts: ["使用者明天要早起", "使用者喜歡吃草莓"], // 知識點
     *   detected_behavior: "wake_up_morning" // 行為模式標籤 (可選)
     * }
     */
    mind.processAnalysis = (userId, analysis) => {
        try {
            if (!analysis) return;

            GoogleSheet.logInfo('Mind.processAnalysis', 'Analyze:', analysis);

            // 1. 更新狀態矩陣 (State Matrix)
            var stateUpdates = {};
            if (analysis.sentiment) stateUpdates.mood = analysis.sentiment;
            if (analysis.energy_level) stateUpdates.energy = analysis.energy_level;

            // 簡單推斷忙碌程度
            if (analysis.intent === 'work') stateUpdates.busyness = 'high';
            else if (analysis.intent === 'chat') stateUpdates.busyness = 'low';

            if (Object.keys(stateUpdates).length > 0) {
                mind.updateUserState(userId, stateUpdates);
            }

            // 2. 自動記憶事實 (Knowledge Consolidation) - 長期
            if (analysis.facts && Array.isArray(analysis.facts) && analysis.facts.length > 0) {
                analysis.facts.forEach(fact => {
                    // 呼叫 GoogleSheet.addKnowledge，標籤設為 'auto_learned'
                    GoogleSheet.addKnowledge(['auto_learned'], fact);
                });
            }



            // 3. 記錄行為模式 (Pattern Logging)
            if (analysis.detected_behavior) {
                mind.logBehavior(userId, analysis.detected_behavior, JSON.stringify(analysis));
            }

        } catch (ex) {
            GoogleSheet.logError('Mind.processAnalysis', ex);
        }
    };

    // ==========================================
    // Part 3: Pattern Engine (行為模式)
    // ==========================================

    /**
     * 記錄使用者行為
     * @param {string} userId
     * @param {string} action - 行為類別 (e.g., 'wake_up', 'sleep', 'commute')
     * @param {string} context - 上下文資訊
     */
    mind.logBehavior = (userId, action, context) => {
        try {
            GoogleSheet.logBehavior(userId, action, context);
        } catch (ex) {
            GoogleSheet.logError('Mind.logBehavior', ex);
        }
    };

    /**
     * 執行定期維護任務 (Cron Job)
     * 包含：
     * 1. Context Consolidation: 總結近期對話情境 (每 6 小時)
     * 2. Pattern Analysis: 分析行為模式
     */
    mind.performMaintenance = () => {
        try {
            GoogleSheet.logInfo('Mind.performMaintenance', 'Starting maintenance tasks...');

            var userId = Config.ADMIN_STRING;
            if (!userId) {
                GoogleSheet.logInfo('Mind.performMaintenance', 'No ADMIN_STRING defined. Skipping.');
                return;
            }

            // ==========================================
            // Task 1: Context Consolidation (短期記憶總結)
            // ==========================================
            try {
                // 讀取最近 30 則對話 (假設涵蓋約 6-12 小時的量)
                var recentHistory = HistoryManager.getUserHistory(userId, 30);
                if (recentHistory && recentHistory.length > 0) {
                    var historyText = recentHistory.map(h => `${h.role === 'user' ? '主人' : 'Christina'}: ${h.parts[0].text}`).join('\n');
                    var summary = mind.updateContextSummary(historyText);

                    if (summary) {
                        GoogleSheet.addShortTermMemory('current_session_context', summary, 24);
                        GoogleSheet.logInfo('Mind.performMaintenance', 'Context updated:', summary);
                    }
                }
            } catch (e) {
                GoogleSheet.logError('Mind.performMaintenance', 'Context task failed', e);
            }

            // ==========================================
            // Task 2: Pattern Analysis (行為模式分析)
            // ==========================================
            GoogleSheet.logInfo('Mind.performMaintenance', 'Running pattern analysis...');

            // 1. 讀取最近 14 天的行為紀錄
            var logs = GoogleSheet.getRecentBehaviors(userId, 14);
            if (!logs || logs.length === 0) {
                GoogleSheet.logInfo('Mind.analyzePatterns', 'No recent behaviors found.');
                return;
            }

            // 2. 統計行為頻率
            // Map: Action -> { Count, Hours: [h1, h2...] }
            var stats = {};
            logs.forEach(log => {
                var action = log.action;
                if (!action) return;

                if (!stats[action]) {
                    stats[action] = { count: 0, hours: [] };
                }
                stats[action].count++;
                if (log.hour !== undefined) {
                    stats[action].hours.push(log.hour);
                }
            });

            // 3. 識別模式 (簡單規則：14天內出現超過 3 次的行為)
            var patterns = [];
            for (var action in stats) {
                var data = stats[action];
                if (data.count >= 3) {
                    // 計算平均時段 (Mode approach or Avereage)
                    // 這裡用簡單的平均
                    var avgHour = 0;
                    if (data.hours.length > 0) {
                        var sum = data.hours.reduce((a, b) => a + b, 0);
                        avgHour = Math.round(sum / data.hours.length);
                    }
                    patterns.push({
                        action: action,
                        count: data.count,
                        avgHour: avgHour
                    });
                }
            }

            // 4. 產生洞察並存入知識庫
            if (patterns.length > 0) {
                var insightTexts = patterns.map(p => {
                    return `主人經常在 ${p.avgHour} 點左右進行「${p.action}」(近兩週 ${p.count} 次)`;
                });

                var summary = "【行為分析報告】\n" + insightTexts.join('\n');

                // 存入 Knowledge (Tag: pattern_insight)
                GoogleSheet.addKnowledge(['pattern_insight', 'auto_analysis'], summary);
                GoogleSheet.logInfo('Mind.analyzePatterns', 'Analysis complete. Insights saved:', summary);
            } else {
                GoogleSheet.logInfo('Mind.analyzePatterns', 'Analysis complete. No strong patterns found.');
            }

        } catch (ex) {
            GoogleSheet.logError('Mind.analyzePatterns', ex);
        }
    };

    /**
     * 更新近期對話的狀態摘要 (Short-term Context Consolidation)
     * @param {string} recentChats - 最近的對話紀錄文字
     * @returns {string|null} - 更新後的摘要 (String)
     */
    mind.updateContextSummary = (recentChats) => {
        try {
            var prompt = `你是 Christina，主人的貼心女僕。
請閱讀以下「最近的對話紀錄」，並生成一段 **「當前對話情境摘要 (Context Summary)」**。

【目標】
這段摘要將作為你的「短期記憶」，讓你下次說話時能馬上進入狀況。
摘要內容應包含：
1. **當前話題**：我們正在聊什麼？(e.g., 修復程式碼、討論晚餐、閒聊心情)
2. **主人狀態**：主人現在的心情、忙碌程度或身體狀況。(e.g., 覺得累、很興奮)
3. **待辦/擱置事項**：是否有什麼事說好等一下要做？(e.g., 晚點要去洗澡、等一下測試 Bug)

【最近對話】
${recentChats}

請生成一段 **精簡、流暢的敘述** (約 50-100 字)，以「第三人稱」或「女僕觀察日記」的角度撰寫。
若對話內容無意義或只是打招呼，請回傳 "null"。

請回傳 JSON 格式：{"summary": "摘要內容..."}`;

            var promptContents = [{ "role": "user", "parts": [{ "text": prompt }] }];
            var response = GeminiService.callAPI(promptContents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                if (text === 'null' || text.includes('"null"')) return null;

                var json = JSON.parse(text);
                return json.summary;
            }
            return null;
        } catch (ex) {
            GoogleSheet.logError('Mind.updateContextSummary', ex);
            return null;
        }
    };




    /**
     * 評估短期記憶是否轉為長期記憶
     * @param {object} memory
     * @returns {object}
     */
    mind.evaluateMemoryForLongTerm = (memory) => {
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
            var response = GeminiService.callAPI(promptContents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            }
            return { keep: false };
        } catch (ex) {
            GoogleSheet.logError('Mind.evaluateMemoryForLongTerm', ex);
            return { keep: false };
        }
    };

    /**
     * 動態決策：下次何時醒來？
     * @param {object} userState - 使用者狀態
     * @param {number} hoursSinceLastChat - 距離上次對話時數
     * @param {string} lastChatRole - 最後是誰說話 ('user' or 'assistant')
     * @returns {object} { delayMinutes: number, reason: string }
     */
    mind.decideNextSchedule = (userState, hoursSinceLastChat, lastChatRole) => {
        try {
            var now = new Date();
            var hour = now.getHours();
            var nowStr = Utilities.formatDate(now, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            // 讀取行事曆 (未來 6 小時)
            var calendarInfo = GoogleCalendar.getUpcomingEvents(0.25); // 查詢 6 小時 = 0.25 天

            // 邏輯修正：如果是 Assistant 剛說完話，這不算是「熱聊」，不能當作 Recently Active
            // 我們把 hoursSinceLastChat 在 Prompt 中標註清楚，讓 AI 判斷
            var isUserActiveRecent = (lastChatRole === 'user' && hoursSinceLastChat < 0.5);

            var prompt = `
現在是 ${nowStr} ( Hour: ${hour} )。
你是 Christina，一個擁有自主時間感的女僕。
你需要決定 **「下一次什麼時候醒來 (Wake Up)」** 檢查有沒有事要做。

【你的原則】
1. **深夜 (01:00 - 06:00)**：通常應該一直睡到早上。如果現在是深夜，請直接睡到早上 7 點半以後。 (Delay > 240 mins)
2. **行事曆優先 (Calendar)**：如果接下來有行程/會議，請務必避開。設定喚醒時間在「會議結束後 5-10 分鐘」。
3. **熱聊過後 (Recently Active)**：只有當 **"主人剛講完話" (User Active)** 時，才設定短一點 (10-30 mins) 隨時待命。
4. **工作中 (Work hours)**：如果主人在忙 (Busyness: high)，不要太常打擾，可以設定 1-2 小時檢查一次。
5. **閒置 (Idle)**：如果已經很久沒講話 (> 3hr)，且不是深夜，可以每 2-4 小時醒來一次看看。

【目前狀態】
- 主人狀態 (Mood: ${userState.mood || 'unknown'}, Energy: ${userState.energy || 5}, Busyness: ${userState.busyness || 'normal'})
- 距離上次說話：${hoursSinceLastChat.toFixed(1)} 小時
- 最後說話者：${lastChatRole} (注意：'assistant' 代表是你最後說話，'user' 代表是主人最後說話)
- 是否為熱聊模式 (Recently Active)? ${isUserActiveRecent ? 'YES' : 'NO'}
- 未來 6 小時行程：
${calendarInfo}

【任務】
請決定下一次喚醒的時間間隔 (分鐘)。
並給出理由。

【判斷準則】
- 如果 LastRole = assistant，代表你剛說完話，現在是在「等待主人回覆」。理由應該是「剛傳送訊息，隨時待命」之類的，**不可** 寫「主人剛講完話」。
- 如果 LastRole = user，代表主人剛講完話，理由才是「主人剛講完話...」。

回傳 JSON 格式：
{
  "delayMinutes": 60,  // 分鐘數 (Int)
  "reason": "現在是深夜，我要睡到早上" // 理由 (String)
}`;

            var contents = [{ "role": "user", "parts": [{ "text": prompt }] }];
            var response = GeminiService.callAPI(contents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            }
            // Default fallback
            return { delayMinutes: 60, reason: "Default fallback (API error)" };

        } catch (ex) {
            GoogleSheet.logError('Mind.decideNextSchedule', ex);
            return { delayMinutes: 60, reason: "Error fallback" };
        }
    };

    return mind;
})();
