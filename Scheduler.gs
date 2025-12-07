/**
 * Scheduler
 * @description 動態排程管理器 - 賦予 Christina 時間感
 */
var Scheduler = (() => {
    var scheduler = {};
    var PROP_NEXT_WAKE = 'NEXT_WAKE_TIME';
    var PROP_WAKE_REASON = 'NEXT_WAKE_REASON';

    /**
     * 重新規劃行程 (Replan)
     * @description 當外部事件(如使用者發話)發生，或剛醒來做完事後，呼叫此函式來決定下次醒來的時間。
     * @param {string} userId - 使用者 ID
     * @param {boolean} isAfterUserInteraction - 是否為「使用者剛講完話」的情境
     */
    scheduler.replan = (userId, isAfterUserInteraction) => {
        try {
            if (!Config.DYNAMIC_SCHEDULING) return;

            GoogleSheet.logInfo('Scheduler.replan', 'Start replanning...', isAfterUserInteraction ? '(User just spoke)' : '(Self-adjustment)');

            // 1. 清除舊的動態 Trigger
            // 無論如何，我們都要重新設定新的，所以先砍舊的
            scheduler.cancelAllDynamicTriggers();

            // 2. 蒐集決策所需的資訊
            var lastChatTime = 0;
            var lastChatRole = 'user'; // Default to user if unknown

            if (isAfterUserInteraction) {
                lastChatTime = new Date().getTime();
                lastChatRole = 'user';
            } else {
                // 從 DB 讀取最後對話時間與角色
                var lastChat = DB().from('chat').limitLoad(1).execute().last();
                if (lastChat && lastChat.timestamp) {
                    lastChatTime = new Date(lastChat.timestamp).getTime();
                    lastChatRole = lastChat.role || 'user';
                }
            }

            var hoursSinceLastChat = (new Date().getTime() - lastChatTime) / (1000 * 60 * 60);

            // 3. 呼叫 Brain (Mind) 進行決策
            var userState = Mind.getUserState(userId);
            // 傳遞 lastChatRole 給 Mind，讓它知道是誰最後講話
            var decision = Mind.decideNextSchedule(userState, hoursSinceLastChat, lastChatRole);

            // 4. 執行決策 (設定 Trigger)
            var delayMinutes = decision.delayMinutes || Config.DEFAULT_WAKE_INTERVAL;

            // 安全檢查：不能低於最小值
            if (delayMinutes < Config.MIN_SLEEP_MINUTES) {
                delayMinutes = Config.MIN_SLEEP_MINUTES;
            }

            scheduler.scheduleNextWake(delayMinutes, decision.reason);

        } catch (ex) {
            GoogleSheet.logError('Scheduler.replan', ex);
            // Failsafe: 如果出錯，至少設個 60 分鐘後的鬧鐘
            scheduler.scheduleNextWake(60, "Emergency Fallback (Error in replan)");
        }
    };

    /**
     * 設定下一次的喚醒 Trigger
     * @param {number} minutesFromNow - 幾分鐘後醒來
     * @param {string} reason - 醒來的原因 (紀錄用)
     */
    scheduler.scheduleNextWake = (minutesFromNow, reason) => {
        try {
            // 建立 TimeBased Trigger
            // 注意：ScriptApp.newTrigger 只能綁定全域函式，不能綁定物件方法
            // 因此我們必須綁定 'Main.onWakeUp' (我們稍後會在 Main.gs 定義這個函式)
            ScriptApp.newTrigger('onWakeUp')
                .timeBased()
                .after(minutesFromNow * 60 * 1000)
                .create();

            // 計算預計喚醒時間
            var now = new Date();
            var wakeTime = new Date(now.getTime() + minutesFromNow * 60 * 1000);
            var wakeTimeStr = Utilities.formatDate(wakeTime, "GMT+8", "yyyy/MM/dd HH:mm:ss");

            // 存入 Script Properties (方便 Debug 查看)
            var props = PropertiesService.getScriptProperties();
            props.setProperty(PROP_NEXT_WAKE, wakeTimeStr);
            props.setProperty(PROP_WAKE_REASON, reason);

            GoogleSheet.logInfo('Scheduler.scheduleNextWake',
                'Next wake set:', wakeTimeStr,
                '(' + minutesFromNow + ' mins)',
                'Reason:', reason
            );

        } catch (ex) {
            GoogleSheet.logError('Scheduler.scheduleNextWake', ex);
        }
    };

    /**
     * 取消所有動態 Triggers
     * @description 只刪除綁定在 'onWakeUp' 的 trigger，保留其他的 (如每日清理)
     */
    scheduler.cancelAllDynamicTriggers = () => {
        try {
            var triggers = ScriptApp.getProjectTriggers();
            var count = 0;
            for (var i = 0; i < triggers.length; i++) {
                if (triggers[i].getHandlerFunction() === 'onWakeUp' ||
                    triggers[i].getHandlerFunction() === 'proactiveMessageCheck') { // 兼容舊名
                    ScriptApp.deleteTrigger(triggers[i]);
                    count++;
                }
            }
            if (count > 0) {
                // GoogleSheet.logInfo('Scheduler.cancelAllDynamicTriggers', 'Canceled ' + count + ' triggers.');
            }
        } catch (ex) {
            GoogleSheet.logError('Scheduler.cancelAllDynamicTriggers', ex);
        }
    };

    return scheduler;
})();
