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

    return calendar;
})();
