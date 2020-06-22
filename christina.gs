//  Christina
var Christina = (function (ct) {
    /**
     * 匹配指令 function
     */
    // h
    var hScript = (event) => {
            Line.replyBtnTemp(event.replyToken, '歡迎雇用 Christina', Christina.getCommandTemp())
        };

    // cmd
    var cmdScript = (event) => {
        if (getLineStatus()) {
            Line.replyMsg(event.replyToken, Christina.getCommandList(event.isMaster));
        }
    };

    // leave
    var leaveScript = (event) => {
        if (getLineStatus()) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '主人掰掰~\nChristina 先行告退了~');
            } else {
                Line.replyMsg(event.replyToken, '掰掰~\nChristina 先行告退了~');
            }
            Line.leave(event.source.type, event.sourceId);
        }
    };

    // myid
    var myidScript = (event) => {
        if (getLineStatus()) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '主人您的ID是：\n' + event.source.userId);
            } else {
                Line.replyMsg(event.replyToken, '好的~\n客倌你的ID是：\n' + event.source.userId);
            }
        }
    };

    // roll
    var rollScript = (event) => {
        if (getLineStatus()) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + Christina.roll());
            } else {
                Line.replyMsg(event.replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + Christina.roll());
            }
        }
    };

    // eat
    var eatScript = (event) => {
        if (getLineStatus()) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, 'Christina 覺得主人應該吃~\n' + Christina.eatWhat());
            } else {
                Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼~');
            }
        }
    };

    // start
    var startScript = (event) => {
        if (event.isMaster) {
            if (getLineStatus() === true) {
                Line.replyMsg(event.replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
            } else {
                setLineStatus(true);
                Line.replyMsg(event.replyToken, 'Christina 開始上班～ \n主人有什麼事請吩咐～ \n要 Christina 下班請輸入 /end');
            }
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定上班時間~');
        }
    };

    // end
    var endScript = (event) => {
        if (event.isMaster) {
            if (getLineStatus() === true) {
                setLineStatus(false);
                Line.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念～ \n要 Christina 上班請輸入 /start');
            } else {
                Line.replyMsg(event.replyToken, 'Christina 已經下班了喔~');
            }
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定下班時間~');
        }
    };

    /**
     *  指令集
     */
    ct.masterCommand = {};
    ct.guestCommand = {};
    ct.allCommand = {};

    /**
     *  功能性 function
     */
    // 初始化 command 物件
    ct.init = () => {
        Christina.guestCommand = {
            '/h': {
                'name': '基礎指令',
                'fn': hScript,
            },
            '/cmd': {
                'name': '指令列表',
                'fn': cmdScript,
            },
            '/leave': {
                'name': '離開',
                'fn': leaveScript,
            },
            '/myid': {
                'name': '顯示ID',
                'fn': myidScript,
            },
            '/roll': {
                'name': '擲骰子',
                'fn': rollScript,
            },
        };
        Christina.masterCommand = {
            '/eat': {
                'name': '吃什麼',
                'fn': eatScript,
            },
            '/start': {
                'name': '啟動',
                'fn': startScript,
            },
            '/end': {
                'name': '結束',
                'fn': endScript,
            },
        };
        Christina.allCommand = Object.assign(Object.assign({}, Christina.guestCommand), Object.assign({}, Christina.masterCommand))
    };

    // 取得指令字串
    ct.getCommandList = (isMaster) => {
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
    };

    // 基礎指令
    ct.getCommandTemp = () => {
        var template = {};
        template.type = 'buttons';
        template.title = "開始雇用 Christina";
        template.thumbnailImageUrl = 'https://scontent.ftpe7-3.fna.fbcdn.net/v/t31.0-8/176372_480432751996994_333402828_o.jpg?_nc_cat=102&_nc_sid=2c4854&_nc_ohc=gloUUqwPeaQAX9BNsAE&_nc_ht=scontent.ftpe7-3.fna&oh=f85b31dac0771502ffcae5bde05026f1&oe=5F1661BA';
        template.text = '基礎指令清單';
        template.actions = [{
            "type": "message",
            "label": Christina.allCommand['/cmd'].name,
            "text": "/cmd"
        }, {
            "type": "message",
            "label": Christina.allCommand['/start'].name,
            "text": "/start"
        }, {
            "type": "message",
            "label": Christina.allCommand['/end'].name,
            "text": "/end"
        }, {
            "type": "message",
            "label": Christina.allCommand['/leave'].name,
            "text": "/leave"
        }];
        return template;
    };

    // 檢查身份
    ct.checkMaster = (userId) => {
        var adminArray = adminString.split(",");
        return adminArray.includes(userId);
    };

    // 檢查是否是指令
    ct.checkCommand = (msg) => {
        return msg.search(/^\//) !== -1;
    };

    // 擲骰子
    ct.roll = () => {
        return Math.floor(Math.random() * 6 + 1);
    };

    // 問吃什麼
    ct.eatWhat = () => {
        var dataExport = {};
        var lastRow = sheetEat.getLastRow();
        var lastColumn = sheetEat.getLastColumn();
        var data = sheetEat.getRange(1, 1, lastRow, lastColumn).getValues();
        for (var i = 0; i <= data.length; i++) {
            dataExport[i] = data[i];
        }
        return dataExport[Math.floor(Math.random() * data.length)];
    };

    return ct;
})(Christina || {});