/**
 * Christina
 * @type {{}}
 * @description (單例) Christina 所提供的指令
 */
var Christina = ((ct) => {
    var scriptProperties = PropertiesService.getScriptProperties();
    // christina
    var christinaScript = (event) => {
        if (event.lineStatus) {
            Line.replyMsg(event.replyToken, Christina.getCommandList(event.isMaster));
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // cmd
    var cmdScript = (event) => {
        if (event.lineStatus) {
            Line.replyMsg(event.replyToken, Christina.getCommandList(event.isMaster));
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // leave
    var leaveScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '主人掰掰~\nChristina 先行告退了');
            } else {
                Line.replyMsg(event.replyToken, 'Bye~\nChristina 先行告退了');
            }
            Line.leave(event.source.type, event.sourceId);
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // myid
    var myidScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '主人您的ID是：\n' + event.source.userId);
            } else {
                Line.replyMsg(event.replyToken, '客倌你的ID是：\n' + event.source.userId);
            }
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // roll
    var rollScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '好的 Christina 為主人擲骰子\n擲出的點數是: ' + Christina.roll());
            } else {
                Line.replyMsg(event.replyToken, '好的 Christina 為客倌擲骰子\n擲出的點數是: ' + Christina.roll());
            }
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // meme
    var memeScript = (event) => {
        if (event.lineStatus) {
            var url = GoogleDrive.getImageUrl(event.commandParam[0]);
            if(url === null) {
                if (event.isMaster) {
                    Line.replyMsg(event.replyToken, '主人忘了梗圖的指令是 meme [梗圖] 了嗎?');
                } else {
                    Line.replyMsg(event.replyToken, '梗圖的指令是 meme [梗圖]');
                }
            } else if (url) {
                Line.replyImageTemp(event.replyToken, url, url);
            } else {
                Line.replyMsg(event.replyToken, 'Christina 找不到這張圖片QQ');
            }
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    }

    // eat
    var eatScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, 'Christina 覺得主人應該吃\n' + Christina.eatWhat());
            } else {
                Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼');
            }
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // money
    var moneyScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '哇主人已經累積了~\n' + Christina.money());
            } else {
                Line.replyMsg(event.replyToken, 'Christina 絕對不會告訴你主人真窮~');
            }
        } else {
            Line.replyMsg(event.replyToken, "Christina 下班了喔");
        }
    };

    // start
    var startScript = (event) => {
        if (event.isMaster) {
            if (event.lineStatus) {
                Line.replyMsg(event.replyToken, '主人有什麼想讓 Christina 服務的嗎');
            } else {
                GoogleSheet.setLineStatus(true);
                Line.replyMsg(event.replyToken, 'Christina 開始上班 \n主人有什麼事請吩咐 \n要 Christina 下班請輸入 end');
            }
        } else {
            Line.replyMsg(event.replyToken, '客倌不是 Christina 的主人\n不能叫我上班');
        }
    };

    // end
    var endScript = (event) => {
        if (event.isMaster) {
            if (event.lineStatus) {
                GoogleSheet.setLineStatus(false);
                Line.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念 \n要 Christina 上班請輸入 start');
            } else {
                Line.replyMsg(event.replyToken, 'Christina 已經下班了喔');
            }
        } else {
            Line.replyMsg(event.replyToken, '客倌不是 Christina 的主人\n不能叫我下班');
        }
    };

    // 指令集
    var gCommand = {
        'christina': {
            'name': '基礎指令',
            'alias': ['安安', '在嗎', 'Christina', '哈嘍', 'Hi', 'hi'],
            'fn': christinaScript,
        },
        'command': {
            'name': '指令列表',
            'alias': ['cmd', '指令', '指令列表'],
            'fn': cmdScript,
        },
        'leave': {
            'name': '離開',
            'alias': ['滾', 'christina 給我離開', 'Christina 給我滾', '給我滾', '離開'],
            'fn': leaveScript,
        },
        'myid': {
            'name': '顯示ID',
            'alias': ['給我id', 'id',],
            'fn': myidScript,
        },
        'roll': {
            'name': '擲骰子',
            'alias': ['擲骰子', '擲'],
            'fn': rollScript,
        },
    };

    var mCommand = {
        'meme': {
            'name': '梗圖',
            'alias': ['圖', '梗圖'],
            'fn': memeScript,
        },
        'eat': {
            'name': '吃什麼',
            'alias': ['吃什麼', 'christina 吃什麼', 'Christina 吃什麼', '今天吃什麼'],
            'fn': eatScript,
        },
        'money': {
            'name': '顯示資產',
            'alias': ['顯示資產', '資產'],
            'fn': moneyScript,
        },
        'start': {
            'name': '啟動',
            'alias': ['啟動', '上班嘍', '上班', 'christina 上班嘍', 'Christina 上班嘍'],
            'fn': startScript,
        },
        'end': {
            'name': '結束',
            'alias': ['結束', '下班嘍', '下班', 'christina 下班嘍', 'Christina 下班嘍'],
            'fn': endScript,
        },
    };

    // 取得 line admin
    ct.adminString = scriptProperties.getProperty('ADMIN_SATRING');

    // admin command list
    ct.masterCommand = mCommand;

    // guest command list
    ct.guestCommand = gCommand;

    // all command list
    ct.allCommand = Object.assign(Object.assign({}, gCommand), Object.assign({}, mCommand));

    /**
     * 取得指令字串
     * @param isMaster
     * @returns {string}
     */
    ct.getCommandList = (isMaster) => {
        try {
            var commandString = '';
            var commandList = {};
            if (isMaster) {
                commandString = '主人可以吩咐的事：\n';
                commandList = Christina.allCommand;
            } else {
                commandString = '主人授權你的事：\n';
                commandList = Christina.guestCommand;
            }
            for (var command in commandList) {
                commandString += command + '：' + commandList[command]['name'] + '\n';
            }
            return commandString;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandList, ex = ' + ex);
        }
    };

    /**
     * 指令集面板
     * @returns {{}}
     */
    ct.getCommandTemp = (isMaster) => {
        try {
            var driveApp = DriveApp;
            var christina = driveApp.getFilesByName("christina.jpg");
            var christinaImg = 'https://lh3.googleusercontent.com/d/' + christina.next().getId();
            var template = {"type": 'carousel'};
            var columns = [];
            var defaultAction = {
                    "type": "message",
                    "label": "點到圖片或標題",
                    "text": "christina"
                };
            columns.push({
                "thumbnailImageUrl": christinaImg,
                "title": "Christina的基本服務",
                "text": "基本服務",
                "defaultAction": defaultAction,
                "actions": [
                    {
                        "type": "message",
                        "label": Christina.allCommand['myid'].name,
                        "text": "myid"
                    }, {
                        "type": "message",
                        "label": Christina.allCommand['roll'].name,
                        "text": "roll"
                    }, {
                        "type": "message",
                        "label": Christina.allCommand['meme'].name,
                        "text": "meme"
                    },
                ]
            });
            if(isMaster)
            {
                var christina2 = driveApp.getFilesByName("christina2.jpg");
                var christina2Img = 'https://lh3.googleusercontent.com/d/' + christina2.next().getId();
                columns.push({
                    "thumbnailImageUrl": christina2Img,
                    "title": "主人的專屬服務",
                    "text": "娛樂",
                    "defaultAction": defaultAction,
                    "actions": [
                        {
                            "type": "message",
                            "label": Christina.allCommand['eat'].name,
                            "text": "eat"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['money'].name,
                            "text": "money"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['command'].name,
                            "text": "command"
                        },
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christina2Img,
                    "title": "主人的專屬服務",
                    "text": "設定",
                    "defaultAction": defaultAction,
                    "actions": [
                        {
                            "type": "message",
                            "label": Christina.allCommand['start'].name,
                            "text": "start"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['end'].name,
                            "text": "end"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['leave'].name,
                            "text": "leave"
                        },
                    ]
                });
            }
            template.columns = columns;
            return template;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandTemp, ex = ' + ex);
        }
    };

    /**
     * 檢查身份
     * @param userId
     * @returns {boolean}
     */
    ct.checkMaster = (userId) => {
        try {
            var adminArray = Christina.adminString.split(",");
            return adminArray.includes(userId);
        } catch (ex) {
            GoogleSheet.logError('Christina.checkMaster, ex = ' + ex);
        }
    };

    /**
     * 檢查是否是指令
     * @param isMaster
     * @param msg
     * @returns {boolean}
     */
    ct.checkCommand = (isMaster, msg) => {
        try {
            var command = (msg === "") ? "" : msg.split(" ").shift();
            return (isMaster) ? Christina.allCommand.hasOwnProperty(command) : Christina.guestCommand.hasOwnProperty(command);
        } catch (ex) {
            GoogleSheet.logError('Christina.checkCommand, ex = ' + ex);
        }
    };

    /**
     * 取得指令參數陣列
     * @param msg
     * @returns {*}
     */
    ct.getCommand = (msg) => {
        try {
            return (msg === "") ? "" : msg.split(" ").shift();
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommand, ex = ' + ex);
        }
    };

    /**
     * 取得指令參數陣列
     * @param msg
     * @returns {[]}
     */
    ct.getCommandParam = (msg) => {
        try {
            var paras = [];
            if (msg !== "") {
                paras = msg.split(" ");
                paras.shift();
            }
            return paras;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandParam, ex = ' + ex);
        }
    };

    /**
     * 擲骰子
     * @returns {number}
     */
    ct.roll = () => {
        try {
            return Math.floor(Math.random() * 6 + 1);
        } catch (ex) {
            GoogleSheet.logError('Christina.roll, ex = ' + ex);
        }
    };

    /**
     * 問吃什麼
     * @returns {*}
     */
    ct.eatWhat = () => {
        try {
            return GoogleSheet.eatWhat();
        } catch (ex) {
            GoogleSheet.logError('Christina.eatWhat, ex = ' + ex);
        }
    };

    /**
     * 取得最新資產
     * @returns {*}
     */
    ct.money = () => {
        try{
            return GoogleSheet.money();
        } catch (ex) {
            GoogleSheet.logError('Christina.money, ex = ' + ex);
        }
    };

    return ct;
})(Christina || {});

/**
 * DB
 * @type {function(): {}}
 * @description (物件) 操作 google sheet 的 model
 */
var DB = (() => {
    var scriptProperties = PropertiesService.getScriptProperties();

    // google sheet 資訊
    var sheetId = scriptProperties.getProperty('SHEET_ID');

    // 取得 sheet
    var christinaSheet = SpreadsheetApp.openById(sheetId);

    // type
    var type;

    // columns
    var columns = [];

    var selectColumns = {};

    var whereCondition = [];

    var updateData = [];

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
            GoogleSheet.logError('db.doSelectColumn, ex = ' + ex);
        }
    }

    // 處理條件式
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
            GoogleSheet.logError('db.doWhere, ex = ' + ex);
        }
    }

    // 處理讀取的資料
    var doResult = () => {
        try {
            var rowData = {};
            var tempRowData = {};
            if (Object.keys(selectColumns).length === 0) {
                for (var i = 1; i < lastRow; i++) {
                    for (var j = 0; j < lastColumn; j++) {
                        rowData[selectColumns[j]] = allData[i][j];
                    }
                    if (doWhere(rowData)) result.push(rowData);
                    rowData = {};
                }

            } else {
                for (var i = 1; i < lastRow; i++) {
                    for (var j = 0; j < lastColumn; j++) {
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
            GoogleSheet.logError('db.doResult, ex = ' + ex);
        }
    }

    // 處理更新資料
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
            GoogleSheet.logError('db.doUpdate, ex = ' + ex);
        }
    }

    var db = {};

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
            GoogleSheet.logError('db.select, ex = ' + ex);
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
            GoogleSheet.logError('db.table, ex = ' + ex);
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
            GoogleSheet.logError('db.where, ex = ' + ex);
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
            GoogleSheet.logError('db.get, ex = ' + ex);
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
            GoogleSheet.logError('db.get, ex = ' + ex);
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
            GoogleSheet.logError('db.first, ex = ' + ex);
        }
    };
    /**
     * 取得 result 第最後一筆資料
     * @param column
     * @returns {*}
     */

    db.last = (column) => {
        try {
            return (result.length === 0) ? {} : (column === undefined) ? result[result.length-1] : result[result.length-1][column];
        } catch (ex) {
            GoogleSheet.logError('db.last, ex = ' + ex);
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
            GoogleSheet.logError('db.table, ex = ' + ex);
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
            var tempData = {};
            tempData[columnName] = value;
            updateData.push(tempData);
        } catch (ex) {
            GoogleSheet.logError('db.set, ex = ' + ex);
        }
        return db;
    };

    return db;
});

/**
 * GoogleDrive
 * @type {{}}
 * @description (單例) 客制化操作 google drive 的 model
 */
var GoogleDrive = ((gd) => {
    var driveApp = DriveApp;

    /**
     * 取得圖片 從 google drive
     * @param name
     * @returns {*}
     */
    gd.getImageUrl = (name) => {
        try {
            var files = driveApp.getFilesByName(name + ".jpg");
            return (files.hasNext()) ? 'https://lh3.googleusercontent.com/d/' + files.next().getId() : null;

        } catch (ex) {
            GoogleSheet.logError('GoogleDrive.getImageUrl, ex = ' + ex);
        }
    };


    return gd;
})(GoogleDrive || {});

/**
 * Line
 * @type {{}}
 * @description (單例) 操作 line 的 model
 */
var Line = ((l) => {
    /**
     * private member
     */
    var scriptProperties = PropertiesService.getScriptProperties();

    // 取得 Line token 從環境變數
    var channelToken = scriptProperties.getProperty('LINE_API_KEY');

    // 取得該所在地 SourceId 從 line response
    var getSourceId = (source) => {
        try {
            switch (source.type) {
                case 'user':
                    return source.userId;
                case 'group':
                    return source.groupId;
                case 'room':
                    return source.roomId;
                default:
                    GoogleSheet.logError('Line, getSourceId, invalid source type!');
                    break;
            }
        } catch (ex) {
            GoogleSheet.logError('Line.getSourceId, ex = ' + ex);
        }
    };

    // 傳送 payload 給 line
    var sendMsg = (url, payload) => {
        GoogleSheet.logSend(payload);
        try {
            UrlFetchApp.fetch(url, {
                'headers': {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + channelToken,
                },
                'method': 'post',
                'payload': payload
            });
        } catch (ex) {
            GoogleSheet.logError('Line.sendMsg, ex = ' + ex);
        }
    };

    l.event = {};

    /**
     * 初始化 event 物件 從 line response
     * @param event
     */
    l.init = (event) => {
        try {
            event.isMaster = Christina.checkMaster(event.source.userId);
            event.isCommand = (event.message == null) ? false : Christina.checkCommand(event.isMaster,event.message.text);
            event.command = (event.isCommand) ? Christina.getCommand(event.message.text) : "";
            event.commandParam = (event.message == null) ? false : Christina.getCommandParam(event.message.text);
            event.sourceId = getSourceId(event.source);
            event.lineStatus = GoogleSheet.lineStatus;
            Line.event = event;
        } catch (ex) {
            GoogleSheet.logError('Line.eventInit, ex = ' + ex);
        }
    };

    /**
     * 執行 command
     */
    l.startEvent = () => {
        try {
            switch (Line.event.type) {
                case 'postback':
                    break;
                case 'message':
                    if (Line.event.command in Christina.allCommand) {
                        Christina.allCommand[Line.event.command].fn(Line.event);

                    } else if (Line.event.isCommand && Line.event.isMaster === true) {
                        Line.replyMsg(Line.event.replyToken, '等主人回家教我了～');

                    } else if (Line.event.isCommand && Line.event.isMaster === false) {
                        Line.replyMsg(Line.event.replyToken, '客官不可以～\n再這樣我要叫了喔');

                    }
                    break;
                case 'join':
                    Line.pushMsg(Line.event.sourceId, 'Hello！我是貼身助理 Christina');
                    break;
                case 'leave':
                    Line.pushMsg(Line.event.sourceId, 'Good Bye！');
                    break;
                case 'memberLeft':
                    Line.pushMsg(Line.event.sourceId, 'Bye！');
                    break;
                case 'memberJoined':
                    Line.pushMsg(Line.event.sourceId, 'Hello！我是貼身助理 Christina');
                    break;
                case 'follow':
                    Line.pushMsg(Line.event.sourceId, 'Hello！我是貼身助理 Christina');
                    break;
                case 'unfollow':
                    Line.pushMsg(Line.event.sourceId, 'Bye bye！');
                    break;
                default:
                    break;
            }
        } catch (ex) {
            GoogleSheet.logError('Line.startEvent, ex = ' + ex);
        }
    };

    /**
     * 發送文字訊息
     * @param usrId
     * @param message
     */
    l.pushMsg = (usrId, message) => {
        try {
            sendMsg('https://api.line.me/v2/bot/message/push', JSON.stringify({
                'to': usrId,
                'messages': [{
                    'type': 'text',
                    'text': message
                }]
            }));
        } catch (ex) {
            GoogleSheet.logError('Line.pushMsg, ex = ' + ex);
        }
    };

    /**
     * 回覆文字訊息
     * @param replyToken
     * @param userMsg
     */
    l.replyMsg = (replyToken, userMsg) => {
        try {
            sendMsg('https://api.line.me/v2/bot/message/reply',
                JSON.stringify({
                    'replyToken': replyToken,
                    'messages': [{
                        'type': 'text',
                        'text': userMsg
                    }]
                }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyMsg, ex = ' + ex);
        }
    };

    /**
     * 回覆按鈕
     * @param replyToken
     * @param altText
     * @param template
     */
    l.replyBtnTemp = (replyToken, altText, template) => {
        try {
            sendMsg('https://api.line.me/v2/bot/message/reply',
                JSON.stringify({
                    'replyToken': replyToken,
                    'messages': [{
                        'type': 'template',
                        'altText': altText,
                        "template": template
                    }]
                }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyBtnTemp, ex = ' + ex);
        }
    };

    /**
     * 回覆圖片
     * @param replyToken
     * @param bUrl
     * @param sUrl
     */
    l.replyImageTemp = (replyToken, bUrl, sUrl) => {
        try {
            sendMsg('https://api.line.me/v2/bot/message/reply',
                JSON.stringify({
                    'replyToken': replyToken,
                    'messages': [{
                        'type': 'image',
                        'originalContentUrl': bUrl,
                        "previewImageUrl": sUrl
                    }]
                }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyBtnTemp, ex = ' + ex);
        }
    };

    /**
     * 離開
     * @param sourceType
     * @param sourceId
     */
    l.leave = (sourceType, sourceId) => {
        try {
            UrlFetchApp.fetch('https://api.line.me/v2/bot/' + sourceType + '/' + sourceId + 'leave', {
                'headers': {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + channelToken,
                },
                'method': 'post',
            });
        } catch (ex) {
            GoogleSheet.logError('Line.leave, ex = ' + ex);
        }
    };

    return l;
})(Line || {});

/**
 * GoogleSheet
 * @type {{}}
 * @description (單例) 客製化操作 google sheet 的 model
 */
var GoogleSheet = ((gsh) => {
    var scriptProperties = PropertiesService.getScriptProperties();

    // google sheet 資訊
    var sheetId = scriptProperties.getProperty('SHEET_ID');

    // 取得 sheet
    var christinaSheet = SpreadsheetApp.openById(sheetId);

    // 取得 console log table
    var sheetConsoleLog = christinaSheet.getSheetByName('consolelog');

    // 取得 eat_what log table
    var sheetEat = christinaSheet.getSheetByName('eat_what');

    /**
     * 取得 line status 狀態
     * @returns {*}
     */
    gsh.lineStatus = (() => {
        try {
            return DB().form('christina').execute().first('status');
        } catch (ex) {
            gsh.logError('GoogleSheet.lineStatus, ex = ' + ex);
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
            GoogleSheet.logError('GoogleSheet.setLineStatus, ex = ' + ex);
        }
    };

    /**
     * 寫 log
     * @param values
     */
    gsh.setLog = (values) => {
        if (sheetConsoleLog != null) {
            var newRow = sheetConsoleLog.getLastRow() + 1;
            sheetConsoleLog.getRange(newRow, 1, 1, values.length).setValues([values]);
        }
    };

    /**
     *  log info
     * @param msg
     */
    gsh.logInfo = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('info');
        gsh.setLog(args);
    };

    /**
     *  log info
     * @param msg
     */
    gsh.logSend = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('send');
        gsh.setLog(args);
    };

    /**
     * error log
     * @param msg
     */
    gsh.logError = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('error');
        gsh.setLog(args);
    };

    /**
     * 取得吃什麼
     * @returns {*}
     */
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
            gsh.logError('GoogleSheet.eatWhat, ex = ' + ex);
        }
    };

    /**
     * 取得最新資產
     * @returns {*}
     */
    gsh.money = () => {
        try {
            return DB().form('money').execute().last('money');
        } catch (ex) {
            gsh.logError('GoogleSheet.money, ex = ' + ex);
        }
    };

    return gsh;
})(GoogleSheet || {});

// 主程序
function doPost(e) {
    try {
        GoogleSheet.logInfo(e.postData.contents);
        var value = JSON.parse(e.postData.contents);
        if (value.events != null) {
            for (var i in value.events) {
                Line.init(value.events[i]);
                Line.startEvent();
            }
        }
    } catch (e) {
        GoogleSheet.logError(e);
    }
}

// 提醒休息
function takeBreak() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "請主人起來走一走~\n休息一下了~");
    } catch (ex) {
        GoogleSheet.logError('crontab, takeBreak, ex = ' + ex);
    }
}

// 提醒理財
function recordAssets() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "請主人記得紀錄資產價值喔~");
    } catch (ex) {
        GoogleSheet.logError('crontab, recordAssets, ex = ' + ex);
    }
}