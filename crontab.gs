// 提醒休息
function takeBreak() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "請主人起來走一走~\n休息一下了~");
    } catch (ex) {
        GoogleSheet().setLog('crontab, takeBreak, ex = ' + ex);
    }
}

// 提醒理財
function recordAssets() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "請主人記得紀錄資產價值喔~");
    } catch (ex) {
        GoogleSheet().setLog('crontab, recordAssets, ex = ' + ex);
    }
}