// google sheet
var GoogleSheet = ((gsh) => {

    // 寫 log
    gsh.setLog = (e) => {
        var lastRow = sheetConsoleLog.getLastRow();
        sheetConsoleLog.getRange(lastRow + 1, 1).setValue(e);
    };

    // 讀取 line status
    gsh.getLineStatus = () => {
        var data = sheetEnv.getSheetValues(1, 2, 1, 1);
        if (data[0][0].length) {
            return false;
        }
        return data[0][0];
    };

    // 寫入 line status
    gsh.setLineStatus = (data) => {
        sheetEnv.getRange(1, 2).setValue(data);
    };

    return gsh;
})(GoogleSheet || {});

// 寫 log
function setLog(e) {
    var lastRow = sheetConsoleLog.getLastRow();
    sheetConsoleLog.getRange(lastRow + 1, 1).setValue(e);
}

// 讀取 line status
function getLineStatus() {
    var data = sheetEnv.getSheetValues(1, 2, 1, 1);
    if (data[0][0].length) {
        return false;
    }
    return data[0][0];
}

// 寫入 line status
function setLineStatus(data) {
    sheetEnv.getRange(1, 2).setValue(data);
}