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

            // 2. 自動記憶事實 (Knowledge Consolidation)
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
     * (未來功能) 分析行為模式並產生洞察
     * 預計由 Cron Job 每日執行
     */
    mind.analyzePatterns = () => {
        try {
            GoogleSheet.logInfo('Mind.analyzePatterns', 'Starting daily behavior analysis...');

            // TODO: 在這裡實作分析邏輯
            // 1. 讀取 behavior_log
            // 2. 統計高頻行為 (e.g. 每天 8 點出門)
            // 3. 產生主動提醒 (Proactive Suggestion)

            GoogleSheet.logInfo('Mind.analyzePatterns', 'Analysis complete. (Placeholder)');
        } catch (ex) {
            GoogleSheet.logError('Mind.analyzePatterns', ex);
        }
    };

    return mind;
})();
