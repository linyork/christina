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

    // value
    var result = [];

    // 處理讀取的 columns
    var doSelectColumn = () => {
        try {
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
        } catch (ex) {
            GoogleSheet.setLog('query.doSelectColumn, ex = ' + ex);
        }
    }

    var doWhere = (rowData) => {
        try {
            var bool = true;
            whereCondition.forEach((condition) => {
                switch (condition['condition']) {
                    case '=':
                    case 'is':
                    case 'IS':
                        if (rowData[condition['name']] != condition['value']) {
                            bool = false;
                        }
                        break;
                    case '>':
                        if (parseInt(rowData[condition['name']]) <= parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '>=':
                        if (parseInt(rowData[condition['name']]) < parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '<':
                        if (parseInt(rowData[condition['name']]) >= parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '<=':
                        if (parseInt(rowData[condition['name']]) > parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                }
            });
            return bool;
        } catch (ex) {
            GoogleSheet.setLog('query.doWhere, ex = ' + ex);
        }
    }

    // 處理讀取的資料
    var doResult = () => {
        try {
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
        } catch (ex) {
            GoogleSheet.setLog('query.doResult, ex = ' + ex);
        }
    }


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
                if (result.length !== 0) return result;
                doSelectColumn();
                doResult();
                return result;
            } catch (ex) {
                GoogleSheet.setLog('query.get, ex = ' + ex);
            }
        },
        first: () => {
            return (obj.get().length !== 0) ? result[0] : {}
        },
    }

    return obj;
});