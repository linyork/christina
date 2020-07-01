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

    var whereCondition = [];

    // table
    var table;

    var allData;

    // last column
    var lastColumn;

    // last row
    var lastRow;

    // 處理讀取的 columns
    var doSelectColumn = () => {
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

    var doWhere = (rowData) => {
        whereCondition.forEach((condition) => {
            switch (condition['condition']) {
                case '=':
                case 'is':
                case 'IS':
                    if (rowData[condition['name']] !== condition['value']) {
                        return false;
                    }
                    break;
                case '>':
                    if (parseInt(rowData[condition['name']]) <= parseInt(condition['value'])) {
                        return false;
                    }
                    break;
                case '>=':
                    if (parseInt(rowData[condition['name']]) < parseInt(condition['value'])) {
                        return false;
                    }
                    break;
                case '<':
                    if (parseInt(rowData[condition['name']]) >= parseInt(condition['value'])) {
                        return false;
                    }
                    break;
                case '<=':
                    if (parseInt(rowData[condition['name']]) > parseInt(condition['value'])) {
                        return false;
                    }
                    break;
            }
        });
        return true;
    }

    // 處理讀取的資料
    var doResult = () => {
        var rowData = {};
        var tempRowData = {};
        if (Object.keys(selectColumns).length === 0) {
            for (var i = 1; i < lastRow; i++) {
                for (j = 0; j < lastColumn; j++) {
                    rowData[selectColumns[j]] = allData[i][j];
                }
                if (doWhere(rowData)) result.push(rowData);
                rowData = {};
            }

        } else {
            for (var i = 1; i < lastRow; i++) {
                for (j = 0; j < lastColumn; j++) {
                    tempRowData[selectColumns[j]] = allData[i][j];
                    if (j in selectColumns) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                }
                if (doWhere(tempRowData)) result.push(rowData);
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
                whereCondition.push({name: name, condition: condition, value: value});
            } catch (ex) {
                GoogleSheet.setLog('query.where, ex = ' + ex);
            }
            return obj;
        },
        get: () => {
            try {
                doSelectColumn();
                doResult();
            } catch (ex) {
                GoogleSheet.setLog('query.get, ex = ' + ex);
            }
            return obj;
        },
    }
    return obj;
});
