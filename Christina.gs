/**
 * Christina
 * @description Christina 指令系統核心模組
 */
var Christina = (() => {
    var christina = {};


    /**
     * 取得使用者稱呼
     * @param {object} event - 事件物件
     * @returns {string}
     */
    var getName = (event) => {
        if (event.profile === null) {
            return '客倌';
        } else if (event.isMaster) {
            return '主人';
        } else {
            return ' ' + event.profile.displayName + ' ';
        }
    };

    // ========== 指令處理函數 ==========

    var christinaScript = (event) => {
        Line.replyBtnTemp(event.replyToken, 'Christina 在這兒～喵❤️', christina.getCommandTemp(event.isMaster));
    };

    var cmdScript = (event) => {
        Line.replyMsg(event.replyToken, christina.getCommandList(event.isMaster));
    };

    var leaveScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, getName(event) + '掰掰~\nChristina 先行告退了～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Bye~\nChristina 先行告退了');
        }
        Line.leave(event.source.type, event.sourceId);
    };

    var myidScript = (event) => {
        Line.replyMsg(event.replyToken, getName(event) + '您的ID是：\n' + event.source.userId);
    };

    var rollScript = (event) => {
        Line.replyMsg(event.replyToken, '好的 Christina 為' + getName(event) + '擲骰子\n擲出的點數是: ' + christina.roll() + '～喵❤️');
    };

    var memeScript = (event) => {
        if (event.commandParam.length) {
            var url = GoogleDrive.getImageUrl(event.commandParam[0] + '.jpg');
            if (url) {
                Line.replyImageTemp(event.replyToken, url, url);
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '!!!!! Christina 找不到這張圖片QQ～喵嗚嗚💔');
            }
        } else {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, getName(event) + '忘了梗圖的指令是 meme [梗圖] 了嗎?');
            } else {
                Line.replyMsg(event.replyToken, '梗圖的指令是 meme [梗圖]');
            }
        }
    };

    var eatScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, 'Christina 覺得' + getName(event) + '應該吃\n' + christina.eatWhat() + '～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼');
        }
    };

    var initChatScript = (event) => {
        if (event.isMaster) {
            ChatBot.clearUserHistory(event.source.userId);
            Line.replyMsg(event.replyToken, getName(event) + ', Christina 回到原廠設定了喔～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, '客倌不能重置 Christina喔');
        }
    };

    var moneyScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, '哇' + getName(event) + '已經累積了~\n' + christina.money() + '\n主人好棒～Christina要吃好多罐罐～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Christina 絕對不會告訴你主人真窮');
        }
    };

    var insertMoneyScript = (event) => {
        if (event.isMaster) {
            if (event.commandParam.length) {
                christina.insertMoney(event.commandParam[0]);
                Line.replyMsg(event.replyToken, 'Christina 已經幫' + getName(event) + '登錄錢錢嘍～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '忘記輸入金額了～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, getName(event) + '想給 Christina 錢錢嗎!');
        }
    };

    var todoScript = (event) => {
        if (event.isMaster) {
            if (event.commandParam.length) {
                christina.todo(event.commandParam[0]);
                Line.replyMsg(event.replyToken, 'Christina 已經幫' + getName(event) + '記住待辦事項了～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '沒說要 Christina 提醒你做什麼～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, getName(event) + '肯定記得不用 Christina 幫你記');
        }
    };

    var todoListScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, getName(event) + christina.todolist());
        } else {
            Line.replyMsg(event.replyToken, '將來的事');
        }
    };

    var doScript = (event) => {
        if (event.isMaster) {
            if (event.commandParam.length) {
                christina.do(event.commandParam[0]);
                Line.replyMsg(event.replyToken, getName(event) + '好棒！Christina 抱一個～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '沒說要做完什麼了～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, '好棒！可是 Christina 沒有獎勵給' + getName(event));
        }
    };

    var startScript = (event) => {
        if (event.isMaster) {
            if (event.lineStatus) {
                Line.replyMsg(event.replyToken, getName(event) + '有什麼想讓 Christina 服務的嗎～喵❤️');
            } else {
                GoogleSheet.setLineStatus(true);
                Line.replyMsg(event.replyToken, getName(event) + ' Christina 開始上班 \n' + getName(event) + '有什麼事請吩咐 \n要 Christina 下班請輸入 end');
            }
        } else {
            Line.replyMsg(event.replyToken, '客倌不是 Christina 的主人\n不能叫我上班');
        }
    };

    var endScript = (event) => {
        if (event.isMaster) {
            GoogleSheet.setLineStatus(false);
            Line.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念 \n要 Christina 上班請輸入 start');
        } else {
            Line.replyMsg(event.replyToken, '客倌不是 Christina 的主人\n不能叫我下班');
        }
    };

    // ========== 指令定義 ==========

    var guestCommands = {
        'christina': {
            'name': '指令面板',
            'alias': ['基礎指令', '指令面板', '安安'],
            'fn': christinaScript,
            'help': '提供@user可使用的指令面板'
        },
        'command': {
            'name': '指令列表',
            'alias': ['command', 'cmd', '指令', '指令列表'],
            'fn': cmdScript,
            'help': '提供@user可使用的指令'
        },
        'leave': {
            'name': '離開',
            'alias': ['leave', '滾', 'christina給我離開', 'christina給我滾', '給我滾', '離開', '娜娜你先離開', '娜娜離開'],
            'fn': leaveScript,
            'help': '讓 Christina 離開 group 或 room'
        },
        'myid': {
            'name': '顯示ID',
            'alias': ['myid', '給我id', 'id', '娜娜給我id'],
            'fn': myidScript,
            'help': '顯示@user的 line id'
        },
        'roll': {
            'name': '擲骰子',
            'alias': ['roll', '擲骰子', '擲'],
            'fn': rollScript,
            'help': '小遊戲擲骰子'
        }
    };

    var masterCommands = {
        'meme': {
            'name': '梗圖',
            'alias': ['meme', '圖', '梗圖'],
            'fn': memeScript,
            'help': '提供梗圖 (指令: meme 黑人問號'
        },
        'eat': {
            'name': '吃什麼',
            'alias': ['eat', '吃什麼', '吃啥', 'christina吃什麼', 'Christina吃什麼', '今天吃什麼'],
            'fn': eatScript,
            'help': '隨機決定吃什麼'
        },
        'initchat': {
            'name': '初始化chat bot',
            'alias': ['initchat', '重置', '清除聊天紀錄'],
            'fn': initChatScript,
            'help': '初始化 chat bot 的對話紀錄'
        },
        'money': {
            'name': '顯示資產',
            'alias': ['money', '顯示資產', '資產'],
            'fn': moneyScript,
            'help': '顯示主人現有資產'
        },
        'insertmoney': {
            'name': '登錄資產',
            'alias': ['insertmoney', '登錄資產', '登錄', 'insertm'],
            'fn': insertMoneyScript,
            'help': '讓主人登錄資產 (指令: insertmoney 100'
        },
        'todo': {
            'name': '待辦事項',
            'alias': ['todo', '待辦', '記得', '記得做', '要做', '幫我記'],
            'fn': todoScript,
            'help': '讓主人紀錄待辦事項 (指令: todo 洗衣服'
        },
        'todolist': {
            'name': '待辦事項列表',
            'alias': ['todolist', '待辦事項', '待辦list', '待辦列表'],
            'fn': todoListScript,
            'help': '顯示待辦事項列表'
        },
        'do': {
            'name': '完成事項',
            'alias': ['do', '完成事項', '完成', '搞定'],
            'fn': doScript,
            'help': '完成事項 (指令: do 洗衣服'
        },
        'start': {
            'name': '啟動',
            'alias': ['start', '啟動', '上班嘍', '上班', 'christina上班嘍', '娜娜上班'],
            'fn': startScript,
            'help': '讓 Christina 上班'
        },
        'end': {
            'name': '結束',
            'alias': ['end', '結束', '下班嘍', '下班', 'christina下班嘍', '娜娜下班'],
            'fn': endScript,
            'help': '讓 Christina 下班'
        }
    };

    christina.guestCommand = guestCommands;
    christina.masterCommand = masterCommands;
    christina.allCommand = Object.assign({}, guestCommands, masterCommands);

    // 建立指令別名映射表（優化查找速度）
    var aliasMap = {};
    for (const [command, cObject] of Object.entries(christina.allCommand)) {
        cObject.alias.forEach(alias => {
            aliasMap[alias.toLowerCase()] = command;
        });
    }

    // ========== 公開方法 ==========

    /**
     * 取得指令列表字串
     * @param {boolean} isMaster - 是否為主人
     * @returns {string}
     */
    christina.getCommandList = (isMaster) => {
        try {
            var commandString = '';
            var commandList = {};
            if (isMaster) {
                commandString = '主人可以吩咐的事：\n';
                commandList = christina.allCommand;
            } else {
                commandString = '主人授權你的事：\n';
                commandList = christina.guestCommand;
            }
            for (var command in commandList) {
                commandString += command + '：' + commandList[command]['name'] + '\n';
            }
            return commandString;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandList', ex);
            return '指令列表載入失敗';
        }
    };

    /**
     * 取得指令面板模板
     * @param {boolean} isMaster - 是否為主人
     * @returns {object}
     */
    christina.getCommandTemp = (isMaster) => {
        try {
            var christinaImg = GoogleDrive.getImageUrl("christina.jpg");
            var template = { "type": 'carousel' };
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
                    { "type": "message", "label": christina.allCommand['myid'].name, "text": "myid" },
                    { "type": "message", "label": christina.allCommand['roll'].name, "text": "roll" },
                    { "type": "message", "label": christina.allCommand['meme'].name, "text": "meme" }
                ]
            });

            if (isMaster) {
                var christinaMasterImg = GoogleDrive.getImageUrl("christina-master.jpg");
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "娛樂",
                    "defaultAction": defaultAction,
                    "actions": [
                        { "type": "message", "label": christina.allCommand['command'].name, "text": "command" },
                        { "type": "message", "label": christina.allCommand['eat'].name, "text": "eat" },
                        { "type": "message", "label": christina.allCommand['initchat'].name, "text": "initchat" }
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "代辦事項",
                    "defaultAction": defaultAction,
                    "actions": [
                        { "type": "message", "label": christina.allCommand['todo'].name, "text": "todo" },
                        { "type": "message", "label": christina.allCommand['todolist'].name, "text": "todolist" },
                        { "type": "message", "label": christina.allCommand['do'].name, "text": "do" }
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "錢錢",
                    "defaultAction": defaultAction,
                    "actions": [
                        { "type": "message", "label": christina.allCommand['money'].name, "text": "money" },
                        { "type": "message", "label": christina.allCommand['insertmoney'].name, "text": "insertmoney" },
                        { "type": "message", "label": "敬請期待主人教我提供圖表", "text": "moneychart" }
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "設定",
                    "defaultAction": defaultAction,
                    "actions": [
                        { "type": "message", "label": christina.allCommand['start'].name, "text": "start" },
                        { "type": "message", "label": christina.allCommand['end'].name, "text": "end" },
                        { "type": "message", "label": christina.allCommand['leave'].name, "text": "leave" }
                    ]
                });
            }

            template.columns = columns;
            return template;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandTemp', ex);
            return null;
        }
    };

    /**
     * 檢查是否為主人
     * @param {string} userId - 使用者 ID
     * @returns {boolean}
     */
    christina.checkMaster = (userId) => {
        try {
            var adminArray = Config.ADMIN_STRING.split(",");
            return adminArray.includes(userId);
        } catch (ex) {
            GoogleSheet.logError('Christina.checkMaster', ex);
            return false;
        }
    };

    /**
     * 檢查是否為指令（優化版 - 使用 Map 查找）
     * @param {string} msg - 訊息
     * @returns {{isCommand: boolean, command: string}}
     */
    christina.checkCommand = (msg) => {
        try {
            var msgCommand = msg.toLowerCase().split(" ").shift();
            var command = aliasMap[msgCommand];
            return {
                "isCommand": !!command,
                "command": command || ""
            };
        } catch (ex) {
            GoogleSheet.logError('Christina.checkCommand', ex);
            return { "isCommand": false, "command": "" };
        }
    };

    /**
     * 取得指令參數
     * @param {string} msg - 訊息
     * @returns {array}
     */
    christina.getCommandParam = (msg) => {
        try {
            var paras = [];
            if (msg !== "") {
                paras = msg.split(" ");
                paras.shift();
            }
            return paras;
        } catch (ex) {
            GoogleSheet.logError('Christina.getCommandParam', ex);
            return [];
        }
    };

    christina.getName = (event) => getName(event);
    christina.roll = () => Math.floor(Math.random() * 6 + 1);
    christina.eatWhat = () => GoogleSheet.eatWhat();
    christina.initChat = () => removeChat();
    christina.money = () => GoogleSheet.money();
    christina.insertMoney = (money) => GoogleSheet.insertMoney(money);
    christina.todo = (something) => GoogleSheet.todo(something);
    christina.todolist = () => '還有\n' + GoogleSheet.todolist() + '沒有做';
    christina.do = (something) => GoogleSheet.do(something);

    return christina;
})();
