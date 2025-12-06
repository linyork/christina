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
     *   detected_behavior: "ask_weather_morning" // 行為模式標籤 (可選)
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

            // 2.5 自動速記短期資訊 (Short Term Notes)
            if (analysis.short_term_notes && Array.isArray(analysis.short_term_notes) && analysis.short_term_notes.length > 0) {
                analysis.short_term_notes.forEach(note => {
                    // 存入短期記憶，預設 24 小時過期
                    // Key 使用 "自動速記"，或根據內容稍微分類(目前簡易處理)
                    GoogleSheet.addShortTermMemory('自動速記', note, 24);
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
     * @param {string} action - 行為類別 (e.g., 'wake_up', 'sleep', 'commute', 'ask_weather')
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
     * 分析行為模式並產生洞察
     * 建議由 Cron Job 每日執行 (e.g. 凌晨 4 點)
     */
    mind.analyzePatterns = () => {
        try {
            GoogleSheet.logInfo('Mind.analyzePatterns', 'Starting daily behavior analysis...');

            var userId = Config.ADMIN_STRING;
            if (!userId) {
                GoogleSheet.logInfo('Mind.analyzePatterns', 'No ADMIN_STRING defined. Skipping analysis.');
                return;
            }

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
     * 將對話紀錄總結為短期記憶
     * @param {string} chatText
     * @returns {object|null}
     */
    mind.summarizeChatsToMemory = (chatText) => {
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
            var response = GeminiService.callAPI(promptContents);

            if (response && response.candidates && response.candidates[0].content) {
                var text = response.candidates[0].content.parts[0].text;
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                if (text === 'null') return null;
                return JSON.parse(text);
            }
            return null;
        } catch (ex) {
            GoogleSheet.logError('Mind.summarizeChatsToMemory', ex);
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

    return mind;
})();
