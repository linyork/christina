// query
var Query = (() => {
    /**
     * private member
     */
    var scriptProperties = PropertiesService.getScriptProperties();

    // google sheet 資訊
    var sheetId = scriptProperties.getProperty('SHEET_ID');

    // 取得 sheet
    var christinaSheet = SpreadsheetApp.openById(sheetId);

    // columns
    var columns = [];

    var selectColumns = {};

    // table
    var table;

    var allData;

    // last column
    var lastColumn;

    // last row
    var lastRow;

    // 處理讀取的 columns
    var getSelectColumn = () => {
        if (columns.length) {
            for (var i = 0; i < lastColumn; i++) {
                if (columns.includes(allData[0][i])) {
                    selectColumns[i] = allData[0][i];
                }
            }
        } else {
            for (var i = 0; i < lastColumn; i++) {
                selectColumns[i] = allData[0][i];
            }
        }
    }

    // 處理讀取的資料
    var getResult = () => {
        var rowData = {};
        if (Object.keys(selectColumns).length === 0) {
            for (var i = 1; i < lastRow; i++) {
                for (j = 0; j < lastColumn; j++) {
                    rowData[selectColumns[j]] = allData[i][j];
                }
                result.push(rowData);
                rowData = {};
            }

        } else {
            for (var i = 1; i < lastRow; i++) {
                for (j = 0; j < lastColumn; j++) {
                    if (j in selectColumns) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                }
                result.push(rowData);
                rowData = {};
            }
        }
        GoogleSheet.setLog(JSON.stringify(result));
    }

    // value
    var result = [];


    /**
     * public member
     */
    var obj = {
        select: (column) => {
            try {
                if (typeof column === 'string' && column !== '') {
                    columns.push(column);
                }
                if (Array.isArray(column)) {
                    column.forEach((i) => {
                        columns.push(i);
                    });
                }
            } catch (ex) {
                GoogleSheet.setLog('query.select, ex = ' + ex);
            }
            return obj;
        },
        table: (name) => {
            try {
                table = christinaSheet.getSheetByName(name);

                lastColumn = table.getLastColumn();

                lastRow = table.getLastRow();

                allData = table.getDataRange().getValues();

            } catch (ex) {
                GoogleSheet.setLog('query.table, ex = ' + ex);
            }
            return obj;
        },
        where: (name, condition, value) => {
            try {
            } catch (ex) {
                GoogleSheet.setLog('query.where, ex = ' + ex);
            }
            return obj;
        },
        get: () => {
            try {
                getSelectColumn();
                getResult();
            } catch (ex) {
                GoogleSheet.setLog('query.get, ex = ' + ex);
            }
            return obj;
        },
    }
    return obj;
});