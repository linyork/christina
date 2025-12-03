/**
 * DB
 * @description 資料庫 ORM 模組 - 操作 Google Sheets 的資料庫介面
 */
var DB = (() => {
    var christinaSheet = SpreadsheetApp.openById(Config.SHEET_ID);

    // 內部變數
    var type;
    var columns = [];
    var selectColumns = {};
    var whereCondition = [];
    var updateData = [];
    var insertData = [];
    var table;
    var allData;
    var lastColumn;
    var lastRow;
    var result = [];
    var range;

    /**
     * 處理讀取的 columns
     */
    var doSelectColumn = () => {
        try {
            if (columns.length) {
                for (var i = 0; i < lastColumn; i++) {
                    if (columns.includes(allData[0][i])) {
                        selectColumns[i] = allData[0][i];
                    }
                }
            } else {
                for (var j = 0; j < lastColumn; j++) {
                    selectColumns[j] = allData[0][j];
                }
            }
        } catch (ex) {
            GoogleSheet.logError('DB.doSelectColumn', ex);
        }
    };

    /**
     * 處理條件式
     * @param {object} rowData - 行資料
     * @returns {boolean}
     */
    var doWhere = (rowData) => {
        try {
            var bool = true;
            whereCondition.forEach((condition) => {
                switch (condition['condition']) {
                    case '=':
                    case 'is':
                    case 'IS':
                        if (rowData[condition['columnName']] != condition['value']) {
                            bool = false;
                        }
                        break;
                    case '>':
                        if (parseInt(rowData[condition['columnName']]) <= parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '>=':
                        if (parseInt(rowData[condition['columnName']]) < parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '<':
                        if (parseInt(rowData[condition['columnName']]) >= parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                    case '<=':
                        if (parseInt(rowData[condition['columnName']]) > parseInt(condition['value'])) {
                            bool = false;
                        }
                        break;
                }
            });
            return bool;
        } catch (ex) {
            GoogleSheet.logError('DB.doWhere', ex);
        }
    };

    /**
     * 處理讀取的資料
     */
    var doResult = () => {
        try {
            let rowData = {};
            let tempRowData = {};
            if (Object.keys(selectColumns).length === 0) {
                for (let i = 1; i < lastRow; i++) {
                    for (let j = 0; j < lastColumn; j++) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                    if (doWhere(rowData)) result.push(rowData);
                    rowData = {};
                }
            } else {
                for (let i = 1; i < lastRow; i++) {
                    for (let j = 0; j < lastColumn; j++) {
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
            GoogleSheet.logError('DB.doResult', ex);
        }
    };

    /**
     * 處理更新資料
     */
    var doUpdate = () => {
        try {
            var rowData = {};
            for (var i = 1; i < lastRow; i++) {
                for (var j = 0; j < lastColumn; j++) {
                    rowData[selectColumns[j]] = allData[i][j];
                }
                if (doWhere(rowData)) {
                    updateData.forEach((data) => {
                        var key = Object.keys(data)[0];
                        rowData[key] = data[key];
                    });
                    var tmpArray = [];
                    Object.keys(rowData).forEach((key) => {
                        tmpArray.push(rowData[key]);
                    });
                    table.getRange(i + 1, 1, 1, tmpArray.length).setValues([tmpArray]);
                }
                rowData = {};
            }
        } catch (ex) {
            GoogleSheet.logError('DB.doUpdate', ex);
        }
    };

    /**
     * 處理新增資料
     */
    var doInsert = () => {
        try {
            var tmpArray = [];
            var columnNameList = allData[0];
            columnNameList.forEach((columnName) => {
                Object.keys(insertData).forEach((key) => {
                    var insertColumnName = Object.keys(insertData[key])[0];
                    var insertValue = Object.values(insertData[key])[0];
                    if (columnName === insertColumnName) tmpArray.push(insertValue);
                });
            });
            table.getRange(lastRow + 1, 1, 1, tmpArray.length).setValues([tmpArray]);
        } catch (ex) {
            GoogleSheet.logError('DB.doInsert', ex);
        }
    };

    /**
     * 處理刪除資料
     */
    var doDelete = () => {
        try {
            var deleteRange = table.getRange(range);
            deleteRange.clear();
        } catch (ex) {
            GoogleSheet.logError('DB.doDelete', ex);
        }
    };

    var db = {};

    /**
     * 設定查詢欄位
     * @param {...string} column - 欄位名稱
     * @returns {object} DB 實例
     */
    db.select = (...column) => {
        try {
            [...column].map((columnName) => {
                if (columnName instanceof String && columnName !== '') {
                    columns.push(columnName);
                }
            });
        } catch (ex) {
            GoogleSheet.logError('DB.select', ex);
        }
        return db;
    };

    /**
     * 設定查詢 table (sheet)
     * @param {string} tableName - 表格名稱
     * @returns {object} DB 實例
     */
    db.from = (tableName) => {
        type = 'S';
        try {
            table = christinaSheet.getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('DB.from', ex);
        }
        return db;
    };

    /**
     * 設定條件式
     * @param {string} columnName - 欄位名稱
     * @param {string} condition - 條件運算子
     * @param {string} value - 值
     * @returns {object} DB 實例
     */
    db.where = (columnName, condition, value) => {
        try {
            whereCondition.push({ columnName: columnName, condition: condition, value: value });
        } catch (ex) {
            GoogleSheet.logError('DB.where', ex);
        }
        return db;
    };

    /**
     * 執行查詢
     * @returns {object} DB 實例
     */
    db.execute = () => {
        try {
            if (table === undefined) throw new Error("未設定 Table");
            if (type === undefined) throw new Error("未設定 type");
            switch (type) {
                case 'S':
                    doSelectColumn();
                    doResult();
                    break;
                case 'U':
                    doSelectColumn();
                    doUpdate();
                    break;
                case 'I':
                    doInsert();
                    break;
                case 'D':
                    doDelete();
                    break;
            }
        } catch (ex) {
            GoogleSheet.logError('DB.execute', ex);
        }
        return db;
    };

    /**
     * 取得查詢結果
     * @returns {array|object}
     */
    db.get = () => {
        try {
            return (result.length === 0) ? {} : result;
        } catch (ex) {
            GoogleSheet.logError('DB.get', ex);
        }
    };

    /**
     * 取得第一筆資料
     * @param {string} column - 欄位名稱（可選）
     * @returns {*}
     */
    db.first = (column) => {
        try {
            return (result.length === 0) ? {} : (column === undefined) ? result[0] : result[0][column];
        } catch (ex) {
            GoogleSheet.logError('DB.first', ex);
        }
    };

    /**
     * 取得最後一筆資料
     * @param {string} column - 欄位名稱（可選）
     * @returns {*}
     */
    db.last = (column) => {
        try {
            return (result.length === 0) ? {} : (column === undefined) ? result[result.length - 1] : result[result.length - 1][column];
        } catch (ex) {
            GoogleSheet.logError('DB.last', ex);
        }
    };

    /**
     * 設定更新 table (sheet)
     * @param {string} tableName - 表格名稱
     * @returns {object} DB 實例
     */
    db.update = (tableName) => {
        type = 'U';
        try {
            table = christinaSheet.getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('DB.update', ex);
        }
        return db;
    };

    /**
     * 設定新增 table (sheet)
     * @param {string} tableName - 表格名稱
     * @returns {object} DB 實例
     */
    db.insert = (tableName) => {
        type = 'I';
        try {
            table = christinaSheet.getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('DB.insert', ex);
        }
        return db;
    };

    /**
     * 設定刪除 table (sheet)
     * @param {string} tableName - 表格名稱
     * @param {string} rangeString - 範圍字串
     * @returns {object} DB 實例
     */
    db.delete = (tableName, rangeString) => {
        type = 'D';
        try {
            table = christinaSheet.getSheetByName(tableName);
            range = rangeString;
        } catch (ex) {
            GoogleSheet.logError('DB.delete', ex);
        }
        return db;
    };

    /**
     * 設定資料
     * @param {string} columnName - 欄位名稱
     * @param {*} value - 值
     * @returns {object} DB 實例
     */
    db.set = (columnName, value) => {
        try {
            if (type === undefined) throw new Error("未設定 type");
            var tempData = {};
            tempData[columnName] = value;
            switch (type) {
                case 'U':
                    updateData.push(tempData);
                    break;
                case 'I':
                    insertData.push(tempData);
                    break;
            }
        } catch (ex) {
            GoogleSheet.logError('DB.set', ex);
        }
        return db;
    };

    return db;
});
