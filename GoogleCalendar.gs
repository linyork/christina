/**
 * GoogleCalendar
 * @description Google Calendar API 封裝
 */
var GoogleCalendar = (() => {
    var calendar = {};

    /**
     * 新增日曆活動
     * @param {string} title - 標題
     * @param {string} startTimeStr - 開始時間 (格式: YYYY-MM-DD HH:mm:ss 或 YYYY/MM/DD HH:mm:ss)
     * @param {number} durationHours - 持續時間 (小時)，預設 1
     * @param {string} description - 描述 (可選)
     * @returns {string} 結果訊息
     */
    calendar.createEvent = (title, startTimeStr, durationHours, description) => {
        try {
            var cal = CalendarApp.getDefaultCalendar();
            var start = new Date(startTimeStr);

            // 檢查日期格式
            if (isNaN(start.getTime())) {
                return '日期格式不正確，請使用 YYYY/MM/DD HH:mm:ss 格式～喵💔';
            }

            var end = new Date(start.getTime() + (durationHours || 1) * 60 * 60 * 1000);

            var options = {
                description: description || 'Created by Christina Bot'
            };

            var event = cal.createEvent(title, start, end, options);
            return '已幫主人新增行程：' + title + ' (' + Utilities.formatDate(start, "Asia/Taipei", "MM/dd HH:mm") + ')～喵❤️';
        } catch (ex) {
            GoogleSheet.logError('GoogleCalendar.createEvent', ex);
            return '新增行程失敗惹～喵💔';
        }
    };

    /**
     * 查詢即將到來的行程
     * @param {number} days - 查詢未來幾天 (預設 7)
     * @returns {string} 行程列表文字
     */
    calendar.getUpcomingEvents = (days) => {
        try {
            days = days || 7;
            var cal = CalendarApp.getDefaultCalendar();
            var now = new Date();
            var endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            var events = cal.getEvents(now, endTime);

            if (events.length === 0) {
                return '未來 ' + days + ' 天沒有特別的行程喔～喵❤️';
            }

            var result = '未來 ' + days + ' 天的行程如下：\n';
            events.forEach(event => {
                var start = Utilities.formatDate(event.getStartTime(), "Asia/Taipei", "MM/dd HH:mm");
                var end = Utilities.formatDate(event.getEndTime(), "Asia/Taipei", "HH:mm");
                var title = event.getTitle();
                var description = event.getDescription();
                result += `- [${start}~${end}] ${title}`;
                if (description) {
                    result += ` (${description})`;
                }
                result += `\n`;
            });

            return result;
        } catch (ex) {
            GoogleSheet.logError('GoogleCalendar.getUpcomingEvents', ex);
            return '讀取行程失敗惹～喵💔';
        }
    };

    /**
     * 刪除日曆活動
     * @param {string} keyword - 活動標題關鍵字
     * @param {string} searchDateStr - 搜尋日期 (格式: YYYY/MM/DD)
     * @returns {string} 結果訊息
     */
    calendar.deleteEvent = (keyword, searchDateStr) => {
        try {
            var cal = CalendarApp.getDefaultCalendar();
            var searchDate = new Date(searchDateStr);

            if (isNaN(searchDate.getTime())) {
                return '日期格式不正確，請提供正確日期 (YYYY/MM/DD)～喵💔';
            }

            // 搜尋當天的所有活動
            var events = cal.getEventsForDay(searchDate);
            var targetEvent = null;

            // 簡單過濾：找標題包含 keyword 的
            for (var i = 0; i < events.length; i++) {
                if (events[i].getTitle().includes(keyword)) {
                    targetEvent = events[i];
                    break;
                }
            }

            if (!targetEvent) {
                return `在 ${Utilities.formatDate(searchDate, "Asia/Taipei", "MM/dd")} 找不到關於「${keyword}」的行程喔～喵💔`;
            }

            var title = targetEvent.getTitle();
            targetEvent.deleteEvent();
            return `已刪除行程：${title}～喵 bye bye 👋`;

        } catch (ex) {
            GoogleSheet.logError('GoogleCalendar.deleteEvent', ex);
            return '刪除行程失敗惹～喵💔';
        }
    };

    /**
     * 修改日曆活動
     * @param {string} keyword - 原活動標題關鍵字
     * @param {string} searchDateStr - 原活動日期
     * @param {string} newTitle - 新標題 (可選)
     * @param {string} newStartTime - 新開始時間 (可選)
     * @param {number} newDuration - 新持續時間 (可選)
     * @returns {string} 結果訊息
     */
    calendar.updateEvent = (keyword, searchDateStr, newTitle, newStartTime, newDuration) => {
        try {
            var cal = CalendarApp.getDefaultCalendar();
            var searchDate = new Date(searchDateStr);

            if (isNaN(searchDate.getTime())) {
                return '日期格式不正確～喵💔';
            }

            // 1. 搜尋活動
            var events = cal.getEventsForDay(searchDate);
            var targetEvent = null;

            for (var i = 0; i < events.length; i++) {
                if (events[i].getTitle().includes(keyword)) {
                    targetEvent = events[i];
                    break;
                }
            }

            if (!targetEvent) {
                return `在 ${Utilities.formatDate(searchDate, "Asia/Taipei", "MM/dd")} 找不到關於「${keyword}」的行程喔～喵💔`;
            }

            var oldTitle = targetEvent.getTitle();
            var resultMsg = `已修改行程「${oldTitle}」：\n`;

            // 2. 更新屬性
            if (newTitle) {
                targetEvent.setTitle(newTitle);
                resultMsg += `- 標題改為：${newTitle}\n`;
            }

            if (newStartTime) {
                var newStart = new Date(newStartTime);
                if (!isNaN(newStart.getTime())) {
                    // 計算原來的時長，如果沒有提供新的 duration，就維持原時長
                    var oldEnd = targetEvent.getEndTime();
                    var oldStart = targetEvent.getStartTime();
                    var durationMs = oldEnd.getTime() - oldStart.getTime();

                    if (newDuration) {
                        durationMs = newDuration * 60 * 60 * 1000;
                    }

                    var newEnd = new Date(newStart.getTime() + durationMs);
                    targetEvent.setTime(newStart, newEnd);
                    resultMsg += `- 時間改為：${Utilities.formatDate(newStart, "Asia/Taipei", "MM/dd HH:mm")}\n`;
                }
            } else if (newDuration) {
                // 只改時長，不改開始時間
                var currentStart = targetEvent.getStartTime();
                var newEnd = new Date(currentStart.getTime() + newDuration * 60 * 60 * 1000);
                targetEvent.setTime(currentStart, newEnd);
                resultMsg += `- 時長改為：${newDuration} 小時\n`;
            }

            return resultMsg + '～喵❤️';

        } catch (ex) {
            GoogleSheet.logError('GoogleCalendar.updateEvent', ex);
            return '修改行程失敗惹～喵💔';
        }
    };

    return calendar;
})();
