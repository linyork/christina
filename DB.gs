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
     * 取得 Spreadsheet 實例 (快取機制)
     * 避免同一執行週期重複呼叫 SpreadsheetApp.openById (Expensive Operation)
     */
    var getSpreadsheet = () => {
        // 使用 Config 中定義的 Key 來作為 Cache Key，確保如果 Config.SHEET_ID 改變也能正確運作
        // 由於 DB 是閉包，我們利用全域變數或 PropertiesService 太慢
        // 這裡利用 JS 模組範圍變數 (Module-scoped variable) 模擬單例
        // 但注意：在 GAS 中，每次 Execution 全域變數會重置，所以這僅針對「單次執行中多次呼叫 DB」有效
        if (typeof DB._cachedSpreadsheet === 'undefined' || DB._cachedId !== Config.SHEET_ID) {
            DB._cachedSpreadsheet = SpreadsheetApp.openById(Config.SHEET_ID);
            DB._cachedId = Config.SHEET_ID;
        }
        return DB._cachedSpreadsheet;
    };

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
                var rowVal = rowData[condition['columnName']];
                var condVal = condition['value'];
                var condType = condition['condition'];

                // 統一型別處理 (避免 parseInt(Date) 造成 NaN)
                var valA = rowVal;
                var valB = condVal;

                // 若都是 Date 物件，轉為 timestamp 數字比較
                if (valA instanceof Date && valB instanceof Date) {
                    valA = valA.getTime();
                    valB = valB.getTime();
                }
                // 若都是可轉為數字的字串或數字，則轉為數字比較 (但排除空字串)
                else if (!isNaN(valA) && !isNaN(valB) && valA !== '' && valB !== '' && !(valA instanceof Date) && !(valB instanceof Date)) {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                }

                switch (condType) {
                    case '=':
                    case 'is':
                    case 'IS':
                        if (rowVal != condVal) { // 保持寬鬆相等，以相容 string/number
                            // Date 需特殊檢查，因為 object != object 恆為 true
                            if (rowVal instanceof Date && condVal instanceof Date) {
                                if (rowVal.getTime() !== condVal.getTime()) bool = false;
                            } else {
                                bool = false;
                            }
                        }
                        break;
                    case '>':
                        if (!(valA > valB)) bool = false;
                        break;
                    case '>=':
                        if (!(valA >= valB)) bool = false;
                        break;
                    case '<':
                        if (!(valA < valB)) bool = false;
                        break;
                    case '<=':
                        if (!(valA <= valB)) bool = false;
                        break;
                }
            });
            return bool;
        } catch (ex) {
            GoogleSheet.logError('DB.doWhere', ex);
            return false; // 安全起見，若報錯則視為不匹配
        }
    };

    /**
     * 處理讀取的資料
     */
    var doResult = () => {
        try {
            let rowData = {};
            let tempRowData = {};
            var headers = allData[0];
            if (Object.keys(selectColumns).length === 0) { // Should be based on columns.length really, but safe if doSelectColumn logic holds
                // Actually, let's rewrite to be robust
            }

            for (let i = 1; i < lastRow; i++) {
                let fullRowData = {};
                // 1. Build full row data for filtering (WHERE condition needs all columns)
                for (let j = 0; j < lastColumn; j++) {
                    fullRowData[headers[j]] = allData[i][j];
                }

                // 2. Check condition
                if (doWhere(fullRowData)) {
                    // 3. Project result (select specific columns or all)
                    if (columns.length > 0) {
                        let rowData = {};
                        columns.forEach(col => {
                            if (fullRowData.hasOwnProperty(col)) {
                                rowData[col] = fullRowData[col];
                            }
                        });
                        result.push(rowData);
                    } else {
                        result.push(fullRowData);
                    }
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
            var minRowIndex = -1;
            var maxRowIndex = -1;
            var isAnyRowUpdated = false;

            // 建立標題索引對照表 (Header Map)
            var headerMap = {};
            if (allData && allData.length > 0) {
                allData[0].forEach((col, idx) => {
                    headerMap[col] = idx;
                });
            }

            // 暫存資料物件
            var rowData = {};

            // 1. 在記憶體中執行篩選與更新
            for (var i = 1; i < lastRow; i++) {
                // 建構 rowData 用於 Where 條件判斷
                for (var j = 0; j < lastColumn; j++) {
                    if (selectColumns[j]) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                }

                if (doWhere(rowData)) {
                    isAnyRowUpdated = true;
                    if (minRowIndex === -1) minRowIndex = i;
                    maxRowIndex = i;

                    updateData.forEach((data) => {
                        var key = Object.keys(data)[0];
                        var newVal = data[key];

                        // 如果 updateData 的 key 有在 headerMap 中找到，才進行更新
                        if (headerMap.hasOwnProperty(key)) {
                            allData[i][headerMap[key]] = newVal;
                        }
                    });
                }
                rowData = {};
            }

            // 2. 批次寫回 Sheet (僅寫回有變動的最外圍範圍)
            if (isAnyRowUpdated) {
                // allData index 從 0 開始 (0是Header)
                // Sheet Row 從 1 開始. allData[minRowIndex] 是 Sheet Row (minRowIndex + 1)
                var startSheetRow = minRowIndex + 1;
                var numRows = maxRowIndex - minRowIndex + 1;

                // 擷取修改過的資料區塊
                var dataToWrite = allData.slice(minRowIndex, maxRowIndex + 1);

                table.getRange(startSheetRow, 1, numRows, lastColumn).setValues(dataToWrite);

                // Logging (Optional but helpful)
                // GoogleSheet.logInfo('DB.doUpdate', `Batch updated rows ${startSheetRow} to ${startSheetRow + numRows - 1}`);
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
     * 處理刪除符合條件的 Row (批次優化)
     */
    var doDeleteRows = () => {
        try {
            var rowsToDelete = [];
            var rowData = {};

            // 1. 掃描需刪除的列
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

            if (rowsToDelete.length === 0) return;

            // 2. 排序 (由大到小)
            rowsToDelete.sort((a, b) => b - a);

            // 3. 批次刪除 (Group contiguous rows)
            // 範例: [10, 9, 8, 5, 2] -> del(8, 3), del(5, 1), del(2, 1)
            for (var i = 0; i < rowsToDelete.length; i++) {
                var currentBlockStart = rowsToDelete[i]; // 現在處理的 Block (最大值)
                var count = 1;

                // 檢查下一筆 (rowsToDelete[i+1]) 是否連續 (比當前小1)
                while (i + 1 < rowsToDelete.length && rowsToDelete[i + 1] === currentBlockStart - 1) {
                    currentBlockStart = rowsToDelete[i + 1]; // Block 往前延伸
                    count++;
                    i++;
                }

                // 執行刪除 (一次刪除 count 行，從該區塊最小的 row 開始)
                table.deleteRows(currentBlockStart, count);
            }

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
                if (typeof columnName === 'string' && columnName !== '') {
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
            // 優化：使用快取 Spreadsheet 物件
            table = getSpreadsheet().getSheetByName(tableName);
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
        if (table === undefined) throw new Error("未設定 Table");
        if (type === undefined) throw new Error("未設定 type");

        // --- 併發控制 (Concurrency Control) ---
        // 若為寫入操作 (I, U, D, DR)，啟用 LockService 防止 Race Condition
        var lock = null;
        var isWriteOp = ['I', 'U', 'D', 'DR'].includes(type);

        if (isWriteOp) {
            lock = LockService.getScriptLock();
            // 等待最多 10 秒，若無法取得鎖則拋出錯誤 (避免資料覆蓋)
            var success = lock.tryLock(10000);
            if (!success) throw new Error('DB is busy (Lock Timeout). Please try again.');
        }

        try {
            // 延遲載入邏輯
            if ((!allData && type !== 'I' && type !== 'D') || type === 'S') { // 如果是查詢或更新/刪除列，執行資料載入 (Insert/Delete 另外處理)
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
                        var lastCol = table.getLastColumn();
                        if (lastCol < 1) {
                            throw new Error("表格 '" + table.getName() + "' 為空，無法執行插入操作。請確認第一列包含欄位名稱 (Headers)。");
                        }
                        allData = table.getRange(1, 1, 1, lastCol).getValues(); // 只讀一行
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
            throw ex; // 重新拋出例外，確保呼叫端知道失敗 (特別是 Lock 失敗)
        } finally {
            // 釋放鎖
            if (lock) {
                lock.releaseLock();
            }
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
            table = getSpreadsheet().getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            // Lazy Load: 延遲到 execute 時才讀取資料
            allData = undefined;
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
            table = getSpreadsheet().getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            // Lazy Load: 延遲到 execute 時才讀取 (且 Insert 只需 Header)
            allData = undefined;
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
            table = getSpreadsheet().getSheetByName(tableName);
            // Lazy Load: execute 會處理 loading
            allData = undefined;
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
            table = getSpreadsheet().getSheetByName(tableName);
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
