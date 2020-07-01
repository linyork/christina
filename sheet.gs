// google sheet
var GoogleSheet = ((gsh) => {
    /**
     * private member
     */
    var scriptProperties = PropertiesService.getScriptProperties();

    // google sheet 資訊
    var sheetId = scriptProperties.getProperty('SHEET_ID');

    // 取得 sheet
    var christinaSheet = SpreadsheetApp.openById(sheetId);

    // 取得 console log table
    var sheetConsoleLog = christinaSheet.getSheetByName('consolelog');

    // 取得 env log table
    var sheetEnv = christinaSheet.getSheetByName('env');

    // 取得 eat_what log table
    var sheetEat = christinaSheet.getSheetByName('eat_what');

    /**
     * public member
     */
    // christina 狀態
    gsh.lineStatus = (() => {
        try {
            var data = sheetEnv.getSheetValues(1, 2, 1, 1);
            return (data[0][0].length) ? false : data[0][0];
        } catch (ex) {
            GoogleSheet.setLog('GoogleSheet.lineStatus, ex = ' + ex);
        }
    })();

    // 寫 log 在 google sheet
    gsh.setLog = (e) => {
        var lastRow = sheetConsoleLog.getLastRow();
        sheetConsoleLog.getRange(lastRow + 1, 1).setValue(e);
    };

    // 寫入 line status 在 google sheet
    gsh.setLineStatus = (data) => {
        try {
            sheetEnv.getRange(1, 2).setValue(data);
        } catch (ex) {
            GoogleSheet.setLog('GoogleSheet.setLineStatus, ex = ' + ex);
        }
    };

    // 取得吃什麼 從 google sheet
    gsh.eatWhat = () => {
        try {
            var dataExport = {};
            var lastRow = sheetEat.getLastRow();
            var lastColumn = sheetEat.getLastColumn();
            var data = sheetEat.getRange(1, 1, lastRow, lastColumn).getValues();
            for (var i = 0; i <= data.length; i++) {
                dataExport[i] = data[i];
            }
            return dataExport[Math.floor(Math.random() * data.length)];
        } catch (ex) {
            GoogleSheet.setLog('GoogleSheet.eatWhat, ex = ' + ex);
        }
    };

    return gsh;
})(GoogleSheet || {});