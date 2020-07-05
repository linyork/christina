// db
const DB = (() => {
        let scriptProperties = PropertiesService.getScriptProperties();

        // google sheet 資訊
        let sheetId = scriptProperties.getProperty('SHEET_ID');

        // 取得 sheet
        let christinaSheet = SpreadsheetApp.openById(sheetId);

        // type
        let type;

        // columns
        let columns = [];

        let selectColumns = {};

        let whereCondition = [];

        let updateData = [];

        // table
        let table;

        let allData;

        // last column
        let lastColumn;

        // last row
        let lastRow;

        // value
        let result = [];

        // 處理讀取的 columns
        let doSelectColumn = () => {
            try {
                if (columns.length) {
                    for (let i = 0; i < lastColumn; i++) {
                        if (columns.includes(allData[0][i])) {
                            selectColumns[i] = allData[0][i];
                        }
                    }
                } else {
                    for (let i = 0; i < lastColumn; i++) {
                        selectColumns[i] = allData[0][i];
                    }
                }
            } catch (ex) {
                GoogleSheet().setLog('db.doSelectColumn, ex = ' + ex);
            }
        }

        // 處理條件式
        let doWhere = (rowData) => {
            try {
                let bool = true;
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
                GoogleSheet().setLog('db.doWhere, ex = ' + ex);
            }
        }

        // 處理讀取的資料
        let doResult = () => {
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
                GoogleSheet().setLog('db.doResult, ex = ' + ex);
            }
        }

        // 處理更新資料
        let doUpdate = () => {
            try {
                let rowData = {};
                for (let i = 1; i < lastRow; i++) {
                    for (let j = 0; j < lastColumn; j++) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                    if (doWhere(rowData)) {
                        updateData.forEach((data) => {
                            let key = Object.keys(data)[0];
                            rowData[key] = data[key];
                        });
                        let tmpArray = [];
                        Object.keys(rowData).forEach((key) => {
                            tmpArray.push(rowData[key]);
                        });
                        table.getRange(i + 1, 1, 1, tmpArray.length).setValues([tmpArray]);
                    }
                    rowData = {};
                }
            } catch (ex) {
                GoogleSheet().setLog('db.doUpdate, ex = ' + ex);
            }
        }

        let db = {};

        /**
         * 設定查詢欄位
         * @param column String...
         * @returns {any}
         */
        db.select = (...column) => {
            try {
                [...column].map((columnName) => {
                    if (columnName instanceof String && columnName !== '') {
                        columns.push(columnName);
                    }
                });
            } catch (ex) {
                GoogleSheet().setLog('db.select, ex = ' + ex);
            }
            return db;
        };
        /**
         * 設定查詢 table(sheet)
         * @param tableName String
         * @returns {any}
         */
        db.form = (tableName) => {
            type = 'S';
            try {
                table = christinaSheet.getSheetByName(tableName);

                lastColumn = table.getLastColumn();

                lastRow = table.getLastRow();

                allData = table.getDataRange().getValues();

            } catch (ex) {
                GoogleSheet().setLog('db.table, ex = ' + ex);
            }
            return db;
        };
        /**
         * 設定條件式
         * @param columnName String
         * @param condition String
         * @param value String
         * @returns {any}
         */
        db.where = (columnName, condition, value) => {
            try {
                whereCondition.push({columnName: columnName, condition: condition, value: value});
            } catch (ex) {
                GoogleSheet().setLog('db.where, ex = ' + ex);
            }
            return db;
        };
        /**
         * 執行
         */
        db.execute = () => {
            try {
                if (table === undefined) {
                    throw new Error("未設定 Table");
                }
                switch (type) {
                    case 'S':
                        doSelectColumn();
                        doResult();
                        break;
                    case 'U':
                        doSelectColumn();
                        doUpdate();
                        break

                }
            } catch (ex) {
                GoogleSheet().setLog('db.get, ex = ' + ex);
            }
            return db;
        };
        /**
         * 取得查詢結果
         * get
         * @returns {[]}
         */
        db.get = () => {
            try {
                return (result.length === 0) ? {} : result;
            } catch (ex) {
                GoogleSheet().setLog('db.get, ex = ' + ex);
            }
        };
        /**
         * 取得 result 第一筆資料
         * @param column
         * @returns {*}
         */
        db.first = (column) => {
            try {
                return (result.length === 0) ? {} : (column === undefined) ? result[0] : result[0][column];
            } catch (ex) {
                GoogleSheet().setLog('db.first, ex = ' + ex);
            }
        };
        /**
         * 設定更新table(sheet)
         * @param tableName String
         * @returns {any}
         */
        db.update = (tableName) => {
            type = 'U';
            try {
                table = christinaSheet.getSheetByName(tableName);

                lastColumn = table.getLastColumn();

                lastRow = table.getLastRow();

                allData = table.getDataRange().getValues();

            } catch (ex) {
                GoogleSheet().setLog('db.table, ex = ' + ex);
            }
            return db;
        };
        /**
         * 設定更新資料
         * @param columnName
         * @param value
         * @returns {any}
         */
        db.set = (columnName, value) => {
            try {
                let tempData = {};
                tempData[columnName] = value;
                updateData.push(tempData);
            } catch (ex) {
                GoogleSheet().setLog('db.set, ex = ' + ex);
            }
            return db;
        };

        return db;
    })
;