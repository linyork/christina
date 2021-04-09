//  Christina
var Christina = ((ct) => {
    var scriptProperties = PropertiesService.getScriptProperties();
    // h
    var hScript = (event) => {
        Line.replyBtnTemp(event.replyToken, '歡迎雇用 Christina', Christina.getCommandTemp())
    };

    // cmd
    var cmdScript = (event) => {
        if (event.lineStatus) {
            Line.replyMsg(event.replyToken, Christina.getCommandList(event.isMaster));
        }
    };

    // leave
    var leaveScript = (event) => {
        if (event.lineStatus) {
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
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '主人您的ID是：\n' + event.source.userId);
            } else {
                Line.replyMsg(event.replyToken, '好的~\n客倌你的ID是：\n' + event.source.userId);
            }
        }
    };

    // roll
    var rollScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + Christina.roll());
            } else {
                Line.replyMsg(event.replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + Christina.roll());
            }
        }
    };

    // meme
    var memeScript = (event) => {
        if (event.lineStatus) {
            if (event.isMaster) {
                var url = GoogleDrive.getImageUrl(event.commandParam[0]);
                if (url) {
                    Line.replyImageTemp(event.replyToken, url, url);
                } else {
                    Line.replyMsg(event.replyToken, 'Christina 找不到這張圖片QQ');
                }
            } else {
                Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~給客倌梗圖~');
            }
        }
    }

    // eat
    var eatScript = (event) => {
        if (event.lineStatus) {
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
            if (event.lineStatus) {
                Line.replyMsg(event.replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
            } else {
                GoogleSheet().setLineStatus(true);
                Line.replyMsg(event.replyToken, 'Christina 開始上班～ \n主人有什麼事請吩咐～ \n要 Christina 下班請輸入 /end');
            }
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定上班時間~');
        }
    };

    // end
    var endScript = (event) => {
        if (event.isMaster) {
            if (event.lineStatus) {
                GoogleSheet().setLineStatus(false);
                Line.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念～ \n要 Christina 上班請輸入 /start');
            } else {
                Line.replyMsg(event.replyToken, 'Christina 已經下班了喔~');
            }
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定下班時間~');
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
        }
    };

    // 指令集
    var gCommand = {
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

    var mCommand = {
        '/meme': {
            'name': '梗圖',
            'fn': memeScript,
        },
        '/eat': {
            'name': '吃什麼',
            'fn': eatScript,
        },
        '/money': {
            'name': '顯示資產',
            'fn': moneyScript,
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
            GoogleSheet().logError('Christina.getCommandList, ex = ' + ex);
        }
    };

    /**
     * 基礎指令
     * @returns {{}}
     */
    ct.getCommandTemp = () => {
        try {
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
        } catch (ex) {
            GoogleSheet().logError('Christina.getCommandTemp, ex = ' + ex);
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
            GoogleSheet().logError('Christina.checkMaster, ex = ' + ex);
        }
    };

    /**
     * 檢查是否是指令
     * @param msg
     * @returns {boolean}
     */
    ct.checkCommand = (msg) => {
        try {
            return msg.search(/^\//) !== -1;
        } catch (ex) {
            GoogleSheet().logError('Christina.checkMaster, ex = ' + ex);
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
            GoogleSheet().logError('Christina.getCommand, ex = ' + ex);
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
            GoogleSheet().logError('Christina.getCommandParam, ex = ' + ex);
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
            GoogleSheet().logError('Christina.roll, ex = ' + ex);
        }
    };

    /**
     * 問吃什麼
     * @returns {*}
     */
    ct.eatWhat = () => {
        try {
            return GoogleSheet().eatWhat();
        } catch (ex) {
            GoogleSheet().logError('Christina.eatWhat, ex = ' + ex);
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
            GoogleSheet().logError('Christina.money, ex = ' + ex);
        }
    }

    return ct;
})(Christina || {});
