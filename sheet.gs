// google sheet
const GoogleSheet = () => {
    let scriptProperties = PropertiesService.getScriptProperties();

    // google sheet 資訊
    let sheetId = scriptProperties.getProperty('SHEET_ID');

    // 取得 sheet
    let christinaSheet = SpreadsheetApp.openById(sheetId);

    // 取得 console log table
    let sheetConsoleLog = christinaSheet.getSheetByName('consolelog');

    // 取得 eat_what log table
    let sheetEat = christinaSheet.getSheetByName('eat_what');

    let gsh = {}

    /**
     * 取得 line status 狀態
     * @returns {*}
     */
    gsh.lineStatus = (() => {
        try {
            return DB().form('christina').execute().first('status');
        } catch (ex) {
            GoogleSheet().logError('GoogleSheet.lineStatus, ex = ' + ex);
        }
    })();

    /**
     * 寫入 line status 狀態
     * @param data
     */
    gsh.setLineStatus = (data) => {
        try {
            DB().update('christina').set('status', data).execute();
        } catch (ex) {
            GoogleSheet().logError('GoogleSheet.setLineStatus, ex = ' + ex);
        }
    };

    /**
     * 寫 log
     * @param values
     */
    gsh.setLog = (values) => {
        if (sheetConsoleLog != null) {
            let newRow = sheetConsoleLog.getLastRow() + 1;
            sheetConsoleLog.getRange(newRow, 1, 1, values.length).setValues([values]);
        }
    };

    /**
     *  log info
     * @param msg
     */
    gsh.logInfo = (...msg) => {
        let args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('info');
        GoogleSheet().setLog(args);
    };

    /**
     * error log
     * @param msg
     */
    gsh.logError = (...msg) => {
        let args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('error');
        GoogleSheet().setLog(args);
    }

    /**
     * 取得吃什麼
     * @returns {*}
     */
    gsh.eatWhat = () => {
        try {
            let dataExport = {};
            let lastRow = sheetEat.getLastRow();
            let lastColumn = sheetEat.getLastColumn();
            let data = sheetEat.getRange(1, 1, lastRow, lastColumn).getValues();
            for (let i = 0; i <= data.length; i++) {
                dataExport[i] = data[i];
            }
            return dataExport[Math.floor(Math.random() * data.length)];
        } catch (ex) {
            GoogleSheet().logError('GoogleSheet.eatWhat, ex = ' + ex);
        }
    };

    return gsh;
};