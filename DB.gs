/**
 * DB
 * @description 資料庫 ORM 模組 - 操作 Google Sheets 的資料庫介面
 */
var DB = (() => {

    // 內部變數
    var type;
    var columns = [];
    var selectColumns = {};
    var whereCondition = [];
    var updateData = [];
    var insertData = [];
    var limitLoadCount = 0;   // 限制讀取筆數 (優化效能用)
    var loadFromTail = false; // 是否從尾端讀取
    var table; // Sheet Object
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

            GoogleSheet.logInfo('DB.doInsert', 'Column names:', JSON.stringify(columnNameList));
            GoogleSheet.logInfo('DB.doInsert', 'Insert data:', JSON.stringify(insertData));

            columnNameList.forEach((columnName) => {
                var found = false;
                Object.keys(insertData).forEach((key) => {
                    var insertColumnName = Object.keys(insertData[key])[0];
                    var insertValue = Object.values(insertData[key])[0];
                    if (columnName === insertColumnName) {
                        tmpArray.push(insertValue);
                        found = true;
                    }
                });
                if (!found) {
                    tmpArray.push(''); // 如果沒有對應的值，填入空字串
                }
            });

            GoogleSheet.logInfo('DB.doInsert', 'Final array:', JSON.stringify(tmpArray));
            GoogleSheet.logInfo('DB.doInsert', 'Writing to row:', lastRow + 1);

            table.getRange(lastRow + 1, 1, 1, tmpArray.length).setValues([tmpArray]);

            GoogleSheet.logInfo('DB.doInsert', 'Write completed');
        } catch (ex) {
            GoogleSheet.logError('DB.doInsert', ex);
        }
    };

    /**
     * 處理刪除符合條件的 Row (由後往前刪)
     */
    var doDeleteRows = () => {
        try {
            var rowsToDelete = [];
            var rowData = {};

            // 遍歷尋找符合的 row (從 1 開始，因為 0 是 header)
            for (var i = 1; i < lastRow; i++) {
                for (var j = 0; j < lastColumn; j++) {
                    rowData[selectColumns[j]] = allData[i][j];
                }
                if (doWhere(rowData)) {
                    // 記錄 row index (Sheet 視角：i + 1)
                    rowsToDelete.push(i + 1);
                }
                rowData = {};
            }

            // 從後往前刪除
            rowsToDelete.sort((a, b) => b - a);
            rowsToDelete.forEach(row => {
                table.deleteRow(row);
            });

            GoogleSheet.logInfo('DB.doDeleteRows', 'Deleted ' + rowsToDelete.length + ' rows.');

        } catch (ex) {
            GoogleSheet.logError('DB.doDeleteRows', ex);
        }
    };

    /**
     * 處理刪除資料 (Clear Range)
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
            // 優化：不立即讀取資料，延遲到 execute() 時才讀取
            // 只先儲存 table 參考，以便後續操作
            table = SpreadsheetApp.openById(Config.SHEET_ID).getSheetByName(tableName);
        } catch (ex) {
            GoogleSheet.logError('DB.from', ex);
        }
        return db;
    };

    /**
     * 設定限制讀取筆數 (優化效能用)
     * @param {number} count - 讀取筆數
     * @param {boolean} fromTail - 是否從最後面開始讀取 (預設 true)
     * @returns {object} DB 實例
     */
    db.limitLoad = (count, fromTail) => {
        limitLoadCount = count;
        loadFromTail = (fromTail === undefined) ? true : fromTail;
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

            // 延遲載入邏輯
            if (!allData || type === 'S') { // 如果是查詢，執行資料載入
                lastColumn = table.getLastColumn();
                var realLastRow = table.getLastRow();

                if (limitLoadCount > 0 && realLastRow > 1) {
                    // 讀取標題列 (Row 1)
                    var headers = table.getRange(1, 1, 1, lastColumn).getValues()[0];
                    allData = [headers];

                    // 計算資料範圍
                    var startRow, numRows;
                    if (loadFromTail) {
                        // 從後面讀取 N 筆
                        startRow = Math.max(2, realLastRow - limitLoadCount + 1);
                        numRows = realLastRow - startRow + 1;
                    } else {
                        // 從前面讀取 N 筆 (跳過 header)
                        startRow = 2;
                        numRows = Math.min(limitLoadCount, realLastRow - 1);
                    }

                    if (numRows > 0) {
                        var partialData = table.getRange(startRow, 1, numRows, lastColumn).getValues();
                        allData = allData.concat(partialData);
                    }
                } else {
                    // 全量讀取
                    allData = table.getDataRange().getValues();
                }

                // 重設 lastRow 為載入後的資料長度 (給 doResult 迴圈使用)
                lastRow = allData.length;
            }

            switch (type) {
                case 'S':
                    doSelectColumn();
                    doResult();
                    break;
                case 'U':
                    // Update 需要真實的 Row Index，目前 Lazy Load 只實作於 Select
                    // 若要支援 Update Lazy Load 需要更複雜的 Row Mapping
                    // 暫時 fallback 回全量讀取如果沒讀過
                    if (!allData) {
                        allData = table.getDataRange().getValues();
                        lastRow = allData.length;
                    }
                    doSelectColumn();
                    doUpdate();
                    break;
                case 'I':
                    // Insert 需要 lastRow 為真實 Sheet 的 lastRow
                    lastRow = table.getLastRow();
                    if (!allData) {
                        // Insert 需要 headers 來對應欄位
                        allData = table.getRange(1, 1, 1, table.getLastColumn()).getValues(); // 只讀一行
                    }
                    doInsert();
                    break;
                case 'D':
                    doDelete();
                    break;
                case 'DR':
                    // Delete Rows (Conditional)
                    if (!allData) {
                        allData = table.getDataRange().getValues();
                        lastRow = allData.length;
                    }
                    doSelectColumn();
                    doDeleteRows();
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
            table = SpreadsheetApp.openById(Config.SHEET_ID).getSheetByName(tableName);
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
            table = SpreadsheetApp.openById(Config.SHEET_ID).getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('DB.insert', 'Error: ' + ex.message + '\nStack: ' + ex.stack);
        }
        return db;
    };

    /**
     * 設定刪除符合條件的 Row
     * @param {string} tableName - 表格名稱
     * @returns {object} DB 實例
     */
    db.deleteRows = (tableName) => {
        type = 'DR';
        try {
            table = SpreadsheetApp.openById(Config.SHEET_ID).getSheetByName(tableName);
            // We need to load data in execute to check conditions
        } catch (ex) {
            GoogleSheet.logError('DB.deleteRows', ex);
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
            table = SpreadsheetApp.openById(Config.SHEET_ID).getSheetByName(tableName);
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
