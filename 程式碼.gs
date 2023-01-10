/**
 * Christina
 * @type {{}}
 * @description (單例) Christina 所提供的指令
 */
var Christina = ((ct) => {
    var scriptProperties = PropertiesService.getScriptProperties();

    // get profile name
    var getName = (event) => {
        if(event.profile === null) {
            return '客倌';
        } else if (event.isMaster) {
            return '主人';
        } else {
            return ' ' + event.profile.displayName + ' ';
        }
    };

    // christina
    var christinaScript = (event) => {
        Line.replyBtnTemp(event.replyToken, 'Christina 在這兒～喵❤️', Christina.getCommandTemp(event.isMaster))
    };

    // cmd
    var cmdScript = (event) => {
        Line.replyMsg(event.replyToken, Christina.getCommandList(event.isMaster));
    };

    // leave
    var leaveScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, getName(event) + '掰掰~\nChristina 先行告退了～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Bye~\nChristina 先行告退了');
        }
        Line.leave(event.source.type, event.sourceId);
    };

    // myid
    var myidScript = (event) => {
        Line.replyMsg(event.replyToken, getName(event) + '您的ID是：\n' + event.source.userId);
    };

    // roll
    var rollScript = (event) => {
        Line.replyMsg(event.replyToken, '好的 Christina 為' + getName(event) + '擲骰子\n擲出的點數是: ' + Christina.roll() + '～喵❤️');
    };

    // kkboxSearchAlbumScript
    var kkboxSearchAlbumScript = (event) => {
        if (event.commandParam.length) {
            Line.replyBtnTemp(event.replyToken, getName(event) + ' Christina 在 KKBOX 找到最相近的專輯', Christina.kkboxsearchalbum(event.commandParam[0]));
        } else {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, getName(event) + '忘了找專輯的指令是 kksa [名稱] 了嗎?');
            } else {
                Line.replyMsg(event.replyToken, '找專輯的指令是 kksa [名稱]');
            }
        }
    };

    // kkboxSearchTrackScript
    var kkboxSearchTrackScript = (event) => {
        if (event.commandParam.length) {
            Line.replyBtnTemp(event.replyToken, getName(event) + ' Christina 在 KKBOX 找到最相近的歌曲', Christina.kkboxsearchtrack(event.commandParam[0]));
        } else {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, getName(event) + '忘了找音樂的指令是 kkst [名稱] 了嗎?');
            } else {
                Line.replyMsg(event.replyToken, '找音樂的指令是 kkst [名稱]');
            }
        }
    };

    // kkboxSearchArtistScript
    var kkboxSearchArtistScript = (event) => {
        if (event.commandParam.length) {
            Line.replyBtnTemp(event.replyToken, getName(event) + ' Christina 在 KKBOX 找到最相近的歌手', Christina.kkboxsearchartist(event.commandParam[0]));
        } else {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, getName(event) + '忘了找歌手的指令是 kkss [名稱] 了嗎?');
            } else {
                Line.replyMsg(event.replyToken, '找歌手的指令是 kkss [名稱]');
            }
        }
    };

    // meme
    var memeScript = (event) => {
        if(event.commandParam.length) {
            var url = GoogleDrive.getImageUrl(event.commandParam[0]+'.jpg');
            if (url) {
                Line.replyImageTemp(event.replyToken, url, url);
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '!!!!! Christina 找不到這張圖片QQ～喵嗚嗚💔');
            }
        }  else {
            if (event.isMaster) {
                Line.replyMsg(event.replyToken, getName(event) + '忘了梗圖的指令是 meme [梗圖] 了嗎?');
            } else {
                Line.replyMsg(event.replyToken, '梗圖的指令是 meme [梗圖]');
            }
        }
    }

    // eat
    var eatScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, 'Christina 覺得' + getName(event) + '應該吃\n' + Christina.eatWhat() + '～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼');
        }
    };

    // init chat bot
    var initChatScript = (event) => {
        if (event.isMaster) {
            Christina.initChat();
            Line.replyMsg(event.replyToken, getName(event) + ', Christina 回到原廠設定了喔～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, '客倌不能重置 Christina喔');
        }
    }

    // money
    var moneyScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, '哇' + getName(event) + '已經累積了~\n' + Christina.money() + '\n主人好棒～Christina要吃好多罐罐～喵❤️');
        } else {
            Line.replyMsg(event.replyToken, 'Christina 絕對不會告訴你主人真窮');
        }
    };

    // insertmoney
    var insertMoneyScript = (event) => {
        if (event.isMaster) {
            if(event.commandParam.length) {
                Christina.insertMoney(event.commandParam[0]);
                Line.replyMsg(event.replyToken, 'Christina 已經幫' + getName(event) + '登錄錢錢嘍～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '忘記輸入金額了～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, getName(event) + '想給 Christina 錢錢嗎!');
        }
    };

    // todo_
    var todoScript = (event) => {
        if (event.isMaster) {
            if(event.commandParam.length) {
                Christina.todo(event.commandParam[0]);
                Line.replyMsg(event.replyToken, 'Christina 已經幫' + getName(event) + '記住待辦事項了～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '沒說要 Christina 提醒你做什麼～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, getName(event) + '肯定記得不用 Christina 幫你記');
        }
    };

    // todolist
    var todoListScript = (event) => {
        if (event.isMaster) {
            Line.replyMsg(event.replyToken, getName(event) + Christina.todolist());
        } else {
            Line.replyMsg(event.replyToken, '將來的事');
        }
    };

    // do
    var doScript = (event) => {
        if (event.isMaster) {
            if(event.commandParam.length) {
                Christina.do(event.commandParam[0]);
                Line.replyMsg(event.replyToken, getName(event) + '好棒！Christina 抱一個～喵❤️');
            } else {
                Line.replyMsg(event.replyToken, getName(event) + '沒說要做完什麼了～喵❤️');
            }
        } else {
            Line.replyMsg(event.replyToken, '好棒！可是 Christina 沒有獎勵給' + getName(event));
        }
    };

    // start
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

    // end
    var endScript = (event) => {
        if (event.isMaster) {
            GoogleSheet.setLineStatus(false);
            Line.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念 \n要 Christina 上班請輸入 start');
        } else {
            Line.replyMsg(event.replyToken, '客倌不是 Christina 的主人\n不能叫我下班');
        }
    };

    // 指令集
    var gCommand = {
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
        },
        'kksearchalbum': {
            'name': '搜尋專輯',
            'alias': ['kksearchalbum', 'kksa', '搜尋專輯', '找專輯'],
            'fn': kkboxSearchAlbumScript,
            'help': 'kkbox搜尋專輯 (指令: kksa 殺破狼'
        },
        'kksearchtrack': {
            'name': '搜尋音樂',
            'alias': ['kksearchtrack', 'kkst', '搜尋音樂', '找音樂', '找歌曲'],
            'fn': kkboxSearchTrackScript,
            'help': 'kkbox搜尋音樂 (指令: kkst 殺破狼'
        },
        'kksearchartist': {
            'name': '搜尋歌手',
            'alias': ['kksearchartist', 'kkss', '搜尋歌手', '找歌手'],
            'fn': kkboxSearchArtistScript,
            'help': 'kkbox搜尋歌手 (指令: kkss 831'
        },
    };

    var mCommand = {
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
            var christinaKkbox = driveApp.getFilesByName("christina-kkbox.jpg");
            var christinaKkboxImg = 'https://lh3.googleusercontent.com/d/' + christinaKkbox.next().getId();
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
            columns.push({
                "thumbnailImageUrl": christinaKkboxImg,
                "title": "Christina的基本服務",
                "text": "音樂服務",
                "defaultAction": defaultAction,
                "actions": [
                    {
                        "type": "message",
                        "label": Christina.allCommand['kksearchalbum'].name,
                        "text": "kksearchalbum"
                    }, {
                        "type": "message",
                        "label": Christina.allCommand['kksearchtrack'].name,
                        "text": "kksearchtrack"
                    }, {
                        "type": "message",
                        "label": Christina.allCommand['kksearchartist'].name,
                        "text": "kksearchartist"
                    },
                ]
            });
            if(isMaster) {
                var christinaMaster = driveApp.getFilesByName("christina-master.jpg");
                var christinaMasterImg = 'https://lh3.googleusercontent.com/d/' + christinaMaster.next().getId();
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "娛樂",
                    "defaultAction": defaultAction,
                    "actions": [
                        {
                            "type": "message",
                            "label": Christina.allCommand['command'].name,
                            "text": "command"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['eat'].name,
                            "text": "eat"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['initchat'].name,
                            "text": "initchat"
                        }
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "代辦事項",
                    "defaultAction": defaultAction,
                    "actions": [
                        {
                            "type": "message",
                            "label": Christina.allCommand['todo'].name,
                            "text": "todo"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['todolist'].name,
                            "text": "todolist"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['do'].name,
                            "text": "do"
                        },
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
                    "title": "主人的專屬服務",
                    "text": "錢錢",
                    "defaultAction": defaultAction,
                    "actions": [
                        {
                            "type": "message",
                            "label": Christina.allCommand['money'].name,
                            "text": "money"
                        }, {
                            "type": "message",
                            "label": Christina.allCommand['insertmoney'].name,
                            "text": "insertmoney"
                        }, {
                            "type": "message",
                            "label": "敬請期待主人教我提供圖表",
                            "text": "moneychart"
                        },
                    ]
                });
                columns.push({
                    "thumbnailImageUrl": christinaMasterImg,
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
     * 檢查是否是指令並取得指令
     * @param msg
     * @returns {{isCommand: boolean, command: string}}
     */
    ct.checkCommand = (msg) => {
        try {

            var msgCommand = msg.toLocaleLowerCase().split(" ").shift();
            var cmdObj = {
                "isCommand": false,
                "command": "",
            }
            for (const [command, cObject] of Object.entries(Christina.allCommand)) {
                cObject.alias.forEach((alias) => {
                    if (alias === msgCommand) {
                        cmdObj.isCommand = true;
                        cmdObj.command = command;
                    }
                });
            }
            return cmdObj;
        } catch (ex) {
            GoogleSheet.logError('Christina.checkCommand, ex = ' + ex);
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
     * 取得使用者名稱
     * @param event
     * @returns {string}
     */
    ct.getName = (event) => {
        return getName(event);
    }

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
     * KKBOX 搜尋 track
     * @param keyword
     * @returns {{type: string}}
     */
    ct.kkboxsearchtrack = (keyword) => {
        try {
            var kkJson = KKBOX.searchtrack(keyword);
            var template = {'type': 'carousel'};
            var columns = [];
            var defaultAction = {
                'type': 'message',
                'label': '點到圖片或標題',
                'text': '找音樂 ' + keyword,
            };
            for (var i = 0; i < kkJson['tracks']['data'].length; i++) {
                var thisTrack = kkJson['tracks']['data'][i];
                columns.push({
                    'thumbnailImageUrl': thisTrack['album']['images'][1]['url'],
                    'title': thisTrack['name'],
                    'text': thisTrack['album']['name'],
                    'defaultAction': defaultAction,
                    'actions': [
                        {
                            'type': 'uri',
                            'label': 'kkbox網址',
                            'uri': thisTrack['url']
                        }
                    ]
                });
            }
            template.columns = columns;
            return template;
        } catch (ex) {
            GoogleSheet.logError('Christina.kkboxsearchtrack, ex = ' + ex);
        }
    };

    /**
     * KKBOX 搜尋 artist
     * @param keyword
     * @returns {{type: string}}
     */
    ct.kkboxsearchartist = (keyword) => {
        try {
            var kkJson = KKBOX.searchartist(keyword);
            var template = {'type': 'carousel'};
            var columns = [];
            var defaultAction = {
                'type': 'message',
                'label': '點到圖片或標題',
                'text': '找歌手 ' + keyword,
            };
            for (var i = 0; i < kkJson['artists']['data'].length; i++) {
                var thisArtist = kkJson['artists']['data'][i];
                columns.push({
                    'thumbnailImageUrl': thisArtist['images'][1]['url'],
                    'title': (thisArtist['name'].length >= 37) ? thisArtist['name'].slice(0, 35) + "..." : thisArtist['name'],
                    'text': keyword + ' 搜尋結果',
                    'defaultAction': defaultAction,
                    'actions': [
                        {
                            'type': 'uri',
                            'label': 'kkbox網址',
                            'uri': thisArtist['url']
                        }
                    ]
                });
            }
            template.columns = columns;
            return template;
        } catch (ex) {
            GoogleSheet.logError('Christina.kkboxsearchartist, ex = ' + ex);
        }
    };

    /**
     * KKBOX 搜尋 album
     * @param keyword
     * @returns {{type: string}}
     */
    ct.kkboxsearchalbum = (keyword) => {
        try {
            var kkJson = KKBOX.searchalbum(keyword);
            var template = {'type': 'carousel'};
            var columns = [];
            var defaultAction = {
                'type': 'message',
                'label': '點到圖片或標題',
                'text': '找專輯 ' + keyword,
            };
            for (var i = 0; i < kkJson['albums']['data'].length; i++) {
                var thisAlbum = kkJson['albums']['data'][i];
                columns.push({
                    'thumbnailImageUrl': thisAlbum['images'][1]['url'],
                    'title': (thisAlbum['name'].length >= 37) ? thisAlbum['name'].slice(0, 35) + "..." : thisAlbum['name'],
                    'text': keyword + ' 搜尋結果',
                    'defaultAction': defaultAction,
                    'actions': [
                        {
                            'type': 'uri',
                            'label': 'kkbox網址',
                            'uri': thisAlbum['url']
                        }
                    ]
                });
            }
            template.columns = columns;
            return template;
        } catch (ex) {
            GoogleSheet.logError('Christina.kkboxsearchartist, ex = ' + ex);
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
     * init chat 資料
     */
    ct.initChat = () => {
        try {
            removeChat();
        } catch (ex) {
            GoogleSheet.logError('Christina.initChatBot, ex = ' + ex);
        }
    }


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

    /**
     * 登錄資產
     * @param money
     */
    ct.insertMoney = (money) => {
        try{
            GoogleSheet.insertMoney(money);
        } catch (ex) {
            GoogleSheet.logError('Christina.insertMoney, ex = ' + ex);
        }
    };

    /**
     * 待辦事項
     * @param something
     */
    ct.todo = (something) => {
        try{
            GoogleSheet.todo(something);
        } catch (ex) {
            GoogleSheet.logError('Christina.todo, ex = ' + ex);
        }
    };

    /**
     * 代辦事項列表
     * @returns {*}
     */
    ct.todolist = () => {
        try{
            return '還有\n' + GoogleSheet.todolist() + '沒有做';
        } catch (ex) {
            GoogleSheet.logError('Christina.todolist, ex = ' + ex);
        }
    };

    /**
     * 完成事項
     * @param something
     */
    ct.do = (something) => {
        try{
            GoogleSheet.do(something);
        } catch (ex) {
            GoogleSheet.logError('Christina.do, ex = ' + ex);
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
    var insertData = [];
    // table
    var table;
    var allData;
    // last column
    var lastColumn;
    // last row
    var lastRow;
    // value
    var result = [];
    // range;
    var range;
    // 處理讀取的 columns
    var doSelectColumn = () => {
        try {
            if (columns.length) {
                for (var i = 0; i < lastColumn; i++) {
                    if (columns.includes(allData[0][i])) {
                        selectColumns[i] = allData[0][ i];
                    }
                }
            } else {
                for (var j = 0; j < lastColumn; j++) {
                    selectColumns[j] = allData[0][j];
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
    // 處理新增資料
    var doInsert = () => {
        try {
            var tmpArray = [];
            var columnNameList = allData[0];
            columnNameList.forEach((columnNmae) => {
                Object.keys(insertData).forEach((key) => {
                    var insertColumnName = Object.keys(insertData[key])[0];
                    var insertValue = Object.values(insertData[key])[0];
                    if(columnNmae === insertColumnName) tmpArray.push(insertValue);
                });
            });
            table.getRange(lastRow + 1, 1, 1, tmpArray.length).setValues([tmpArray]);
        } catch (ex) {
            GoogleSheet.logError('db.doInsert, ex = ' + ex);
        }
    }
    // 處理刪除資料
    var doDelete = () => {
        try {
            var deleteRange = table.getRange(range);
            deleteRange.clear();
        } catch (ex) {
            GoogleSheet.logError('db.doDelete, ex = ' + ex);
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
    db.from = (tableName) => {
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
     * @returns {{}}
     */
    db.update = (tableName) => {
        type = 'U';
        try {
            table = christinaSheet.getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('db.update, ex = ' + ex);
        }
        return db;
    };
    /**
     * 設定新增table(sheet)
     * @param tableName String
     * @returns {{}}
     */
    db.insert = (tableName) => {
        type = 'I';
        try {
            table = christinaSheet.getSheetByName(tableName);
            lastColumn = table.getLastColumn();
            lastRow = table.getLastRow();
            allData = table.getDataRange().getValues();
        } catch (ex) {
            GoogleSheet.logError('db.insert, ex = ' + ex);
        }
        return db;
    };
    /**
     * 設定刪除table(sheet)
     * @param tableName String
     * @param rangeString String
     * @returns {{}}
     */
    db.delete = (tableName, rangeString) => {
        type = 'D';
        try {
            table = christinaSheet.getSheetByName(tableName);
            range = rangeString;
        } catch (ex) {
            GoogleSheet.logError('db.delete, ex = ' + ex);
        }
        return db;
    };
    /**
     * 設定資料
     * @param columnName
     * @param value
     * @returns {{}}
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
                    break
            }
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
            var files = driveApp.getFilesByName(name);
            if(files.hasNext()){
                return 'https://lh3.googleusercontent.com/d/' + files.next().getId();
            } else {
                return null;
            }
        } catch (ex) {
            GoogleSheet.logError('GoogleDrive.getImageUrl, ex = ' + ex);
        }
    };

    return gd;
})(GoogleDrive || {});

/**
 * KKBOX
 * @type {{}}
 * @description (單例) 客制化操作 KKBOX 的 model
 */
var KKBOX = ((kk) => {
    var scriptProperties = PropertiesService.getScriptProperties();

    // 取得 KKBOX client id 從環境變數
    var clientId = scriptProperties.getProperty('KKBOX_CLIENT_ID');

    // 取得 KKBOX client secret token 從環境變數
    var clientSecret = scriptProperties.getProperty('KKBOX_CLIENT_SECRET');

    // 取得 access token
    var accessToken = () => {
        try {
            return JSON.parse(UrlFetchApp.fetch('https://account.kkbox.com/oauth2/token', {
                'method': 'post',
                'payload': {
                    'grant_type': 'client_credentials',
                    'client_id': clientId,
                    'client_secret': clientSecret
                }
            }).getContentText())['access_token'];
        } catch (ex) {
            GoogleSheet.logError('KKBOX.accessToken, ex = ' + ex);
        }
    }

    /**
     * 找歌曲
     * @param keyword
     * @returns {any}
     */
    kk.searchtrack = (keyword) => {
        try {
            var q = keyword;
            var type = 'track';
            var territory = 'TW';
            var offset = 0;
            var limit = 5;
            var path = 'https://api.kkbox.com/v1.1/search';
            var apiUrl = path + '?q=' + q + '&type=' + type + '&territory=' + territory + '&offset=' + offset + '&limit=' + limit;
            return JSON.parse(UrlFetchApp.fetch(apiUrl, {
                "headers": {
                    "accept": "application/json",
                    "authorization": "Bearer " + accessToken()
                }
            }).getContentText());
        } catch (ex) {
            GoogleSheet.logError('KKBOX.searchtrack, ex = ' + ex);
        }
    };

    /**
     * 找歌手
     * @param keyword
     * @returns {any}
     */
    kk.searchartist = (keyword) => {
        try {
            var q = keyword;
            var type = 'artist';
            var territory = 'TW';
            var offset = 0;
            var limit = 5;
            var path = 'https://api.kkbox.com/v1.1/search';
            var apiUrl = path + '?q=' + q + '&type=' + type + '&territory=' + territory + '&offset=' + offset + '&limit=' + limit;
            return JSON.parse(UrlFetchApp.fetch(apiUrl, {
                "headers": {
                    "accept": "application/json",
                    "authorization": "Bearer " + accessToken()
                }
            }).getContentText());
        } catch (ex) {
            GoogleSheet.logError('KKBOX.searchartist, ex = ' + ex);
        }
    };

    /**
     * 找專輯
     * @param keyword
     * @returns {any}
     */
    kk.searchalbum = (keyword) => {
        try {
            var q = keyword;
            var type = 'album';
            var territory = 'TW';
            var offset = 0;
            var limit = 5;
            var path = 'https://api.kkbox.com/v1.1/search';
            var apiUrl = path + '?q=' + q + '&type=' + type + '&territory=' + territory + '&offset=' + offset + '&limit=' + limit;
            return JSON.parse(UrlFetchApp.fetch(apiUrl, {
                "headers": {
                    "accept": "application/json",
                    "authorization": "Bearer " + accessToken()
                }
            }).getContentText());
        } catch (ex) {
            GoogleSheet.logError('KKBOX.searchalbum, ex = ' + ex);
        }
    };

    return kk;
})(KKBOX || {});

/**
 * HTMLTOOl
 * @type {{}}
 * @description (單例) 一些自幹的 html tool
 */
var HTMLTOOl = ((ht) =>{

    var  unentitize = (strEncoded) => {
        return strEncoded
            && XmlService.parse(
                '<z>' + (strEncoded + '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</z>'
            ).getRootElement().getText();
    };

    /**
     * get meat
     * @param url
     * @returns {{metas: {}, title: *}}
     */
    ht.getHtmlMeta = (url) => {
        var strXML = UrlFetchApp.fetch(url, {muteHttpExceptions: true}).getContentText();
        var metas = {};
        var result = {
            title: unentitize((/<title>(.+?)<\/title>/i.exec(strXML) || [])[1]),
            metas: metas
        };
        strXML.replace(/<meta(?=[^>]*\sname="([^"]*)")(?=[^>]*\scontent="([^"]*)")[^>]*\/?>/ig,
            (m, name, content) =>{
                metas[name = unentitize(name)] = content = unentitize(content);
                if (/^description$/i.test(name)) {
                    result.description = content;
                } else if (/^keywords?$/i.test(name)) {
                    result.keywords = content;
                }
            });
        strXML.replace(/<meta(?=[^>]*\sproperty="([^"]*)")(?=[^>]*\scontent="([^"]*)")[^>]*\/?>/ig,
            (m, name, content) =>{
                metas[name = unentitize(name)] = content = unentitize(content);
                if (/^description$/i.test(name)) {
                    result.description = content;
                } else if (/^keywords?$/i.test(name)) {
                    result.keywords = content;
                }
            });
        return result;
    }

    /**
     * isJsonStr
     * @param str
     * @returns {boolean}
     */
    ht.isJsonStr = (str) => {

        if (typeof str == 'string') {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                console.log(e);
                return false;
            }

        }
        return false;
    }

    return ht;
})(HTMLTOOl || {});

/**
 * Line
 * @type {{}}
 * @description (單例) 操作 line 的 model
 */
var Line = ((l) => {
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

    // 取得個人資訊
    getProfile = (source) => {
        try {
            var profile = {}
            switch (source.type) {
                case 'user':
                    profile = JSON.parse(UrlFetchApp.fetch('https://api.line.me/v2/bot/profile/' + source.userId, {
                        'headers': {
                            'Authorization': 'Bearer ' + channelToken,
                        },
                    }).getContentText());
                    break;
                case 'group':
                    profile = JSON.parse(UrlFetchApp.fetch('https://api.line.me/v2/bot/group/' + source.groupId + '/member/' + source.userId, {
                        'headers': {
                            'Authorization': 'Bearer ' + channelToken,
                        },
                    }).getContentText());
                    break;
                case 'room':
                    profile = JSON.parse(UrlFetchApp.fetch('https://api.line.me/v2/bot/room/' + source.roomId + '/member/' + source.userId, {
                        'headers': {
                            'Authorization': 'Bearer ' + channelToken,
                        },
                    }).getContentText());
                    break;
                default:
                    profile.userId = null;
                    profile.displayName = null;
                    profile.pictureUrl = null;
                    break
            }
            return profile;
        } catch (ex) {
            GoogleSheet.logError('Line.getProfile, ex = ' + ex);
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
            event.profile = getProfile(event.source);
            if(event.message === null || event.message === undefined){
                event.isCommand = false;
                event.command = "";
                event.commandParam = false;
            } else {
                var cmdObj = Christina.checkCommand(event.message.text);
                event.isCommand = cmdObj.isCommand;
                event.command = cmdObj.command;
                event.commandParam = Christina.getCommandParam(event.message.text);
            }
            event.sourceId = getSourceId(event.source);
            event.lineStatus = GoogleSheet.lineStatus;
            Line.event = event;
        } catch (ex) {
            GoogleSheet.logError('Line.eventInit, ex = ' + ex);
        }
    };

    l.isLine = (string) => {
        return HTMLTOOl.isJsonStr(string) && JSON.parse(string).hasOwnProperty("events");
    };

    /**
     * 執行 command
     */
    l.startEvent = () => {
        try {
            switch (Line.event.type) {
                case 'postback':
                    // 暫不動作
                    break;
                case 'message':
                    if (Line.event.isCommand) {
                        if (Line.event.lineStatus) {
                            if (Line.event.commandParam.indexOf('help') !== -1 || Line.event.commandParam.indexOf('h') !== -1) {
                                var commandHelp = Christina.allCommand[Line.event.command].help;
                                Line.replyMsg(Line.event.replyToken, commandHelp.replace(/@user/, Christina.getName(Line.event)));
                            } else if (Line.event.commandParam.indexOf('alias') !== -1 || Line.event.commandParam.indexOf('其他指令') !== -1) {
                                var commandName = Christina.allCommand[Line.event.command].name;
                                var commandAlias = Christina.allCommand[Line.event.command].alias.toString();
                                Line.replyMsg(Line.event.replyToken, commandName + "的其他指令有: " + commandAlias);
                            } else {
                                Christina.allCommand[Line.event.command].fn(Line.event);
                            }
                        } else if (!Line.event.lineStatus && Line.event.command === 'start') {
                            Christina.allCommand[Line.event.command].fn(Line.event);
                        } else {
                            Line.replyMsg(Line.event.replyToken, "Christina 下班了喔");
                        }
                    } else {
                        // openAi Bot
                        if (Line.event.isMaster) {
                            Line.replyMsg(Line.event.replyToken, ChatBoot.replay(Line.event.message.text));
                        } else {
                            Line.replyMsg(Line.event.replyToken, "Christina 覺得困惑了");
                        }
                    }
                    break;
                case 'join':
                    Line.pushMsg(Line.event.sourceId, '大家好！我是 Christina！');
                    break;
                case 'leave':
                    // 暫不動作
                    break;
                case 'memberLeft':
                    Line.pushMsg(Line.event.sourceId, Christina.getName(Line.event) + '離開了！我們緬懷他');
                    break;
                case 'memberJoined':
                    Line.pushMsg(Line.event.sourceId, Christina.getName(Line.event) + '你好！我是 Christina');
                    break;
                case 'follow':
                    Line.pushMsg(Line.event.sourceId, Christina.getName(Line.event) + '你好！我是 Christina');
                    break;
                case 'unfollow':
                    Line.pushMsg(Line.event.sourceId, '好可惜以後 Christina 會提供更多服務的');
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
            UrlFetchApp.fetch('https://api.line.me/v2/bot/' + sourceType + '/' + sourceId + '/leave', {
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

    // 取得 eat_what table
    var sheetEat = christinaSheet.getSheetByName('eat_what');

    /**
     * 取得 line status 狀態
     * @returns {*}
     */
    gsh.lineStatus = (() => {
        try {
            return DB().from('christina').execute().first('status');
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
            gsh.logError('GoogleSheet.setLineStatus, ex = ' + ex);
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
     * log info
     * @param msg
     */
    gsh.logInfo = (...msg) => {
        var args = [...msg].map((v) => JSON.stringify(v));
        args.unshift('info');
        gsh.setLog(args);
    };

    /**
     * log send
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
            return DB().from('money').execute().last('money');
        } catch (ex) {
            gsh.logError('GoogleSheet.money, ex = ' + ex);
        }
    };

    /**
     * 登錄資產
     * @param money
     */
    gsh.insertMoney = (money) => {
        try {
            var Today = new Date();
            var date = Today.getFullYear() + "/" + (Today.getMonth() + 1) + "/" + Today.getDate();
            DB().insert('money').set('money', money).set('date', date).execute();
        } catch (ex) {
            gsh.logError('GoogleSheet.money, ex = ' + ex);
        }
    };

    /**
     * 加入待辦事項
     * @param something
     */
    gsh.todo = (something) => {
        try {
            DB().insert('todo').set('content', something).set('do', 0).execute();
        } catch (ex) {
            gsh.logError('GoogleSheet.todo, ex = ' + ex);
        }
    };

    /**
     * 待辦事項列表
     * @returns {*}
     */
    gsh.todolist = () => {
        try {
            var returnString = ""
            var todoList = DB().from('todo').where('do','=',0).execute().get();
            for (let i = 0; i < todoList.length; i++) {
                returnString = returnString + "[ ]" + todoList[i].content + "\n";
            }
            return returnString
        } catch (ex) {
            gsh.logError('GoogleSheet.todolist, ex = ' + ex);
        }
    };

    /**
     * 完成事項
     * @param something
     */
    gsh.do = (something) => {
        try {
            DB().update('todo').where('content','=', something).set('do', 1).execute();
        } catch (ex) {
            gsh.logError('GoogleSheet.do, ex = ' + ex);
        }
    };

    return gsh;
})(GoogleSheet || {});

var ChatBoot = ((cb) => {
    var scriptProperties = PropertiesService.getScriptProperties();
    // 取得 API KEY
    var apiKey = scriptProperties.getProperty('CHATGPT_API_KEY');
    cb.replay = (message) => {
        try {
            // 取得所有對話
            var allTalk = DB().select('talk').from('chat').execute().get().map(({talk}) => talk);
            // 打 api
            var apiEndpoint = 'https://api.openai.com/v1/completions';
            var options = {
                "method" : "post",
                "headers": {"Authorization": "Bearer " + apiKey},
                "contentType": "application/json",
                "payload" : JSON.stringify({
                    "model": "text-davinci-003",
                    "prompt": allTalk.join('\n')+"\nHuman: "+message+"\nAI: ",
                    "temperature": 1,
                    "max_tokens": 512,
                    "top_p": 0.9,
                    "frequency_penalty": 0.27,
                    "presence_penalty": 0.63,
                    "stop": [" Human:", " AI:"],
                })
            };
            var response = UrlFetchApp.fetch(apiEndpoint, options);
            var data = JSON.parse(response.getContentText());
            var aiMessage = data.choices[0].text;
            // 記錄對話
            var thisTalk = 'Human: '+message;
            var aiTalk = 'AI: '+aiMessage;
            allTalk.push(thisTalk);
            allTalk.push(aiTalk);
            DB().insert('chat').set('talk', thisTalk).execute();
            DB().insert('chat').set('talk', aiTalk).execute();
            return aiMessage;
        } catch (error) {
            GoogleSheet.logError(error);
            return '主人不好意思我有點混亂';
        }
    };
    return cb;
})(ChatBoot || {})

// 主程序
function doPost(e) {
    try {
        // is line
        if(Line.isLine(e.postData.contents)) {
            var jsonData = JSON.parse(e.postData.contents);
            if (jsonData.events != null) {
                for (var i in jsonData.events) {
                    Line.init(jsonData.events[i]);
                    Line.startEvent();
                }
            }
        }

    } catch (error) {
        GoogleSheet.logError(e.postData.contents);
        GoogleSheet.logError(error);
    }
}

// 提醒休息
function takeBreak() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "主人，現在起身走一走吧！我陪你一起走～喵❤️");
    } catch (ex) {
        GoogleSheet.logError('crontab, takeBreak, ex = ' + ex);
    }
}

// 提醒理財
function recordAssets() {
    try {
        Line.pushMsg(Christina.adminString.split(",")[0], "主人，現在是時候要登記資產了，我會陪你一起完成～喵❤️");
    } catch (ex) {
        GoogleSheet.logError('crontab, recordAssets, ex = ' + ex);
    }
}

// 每天清空 AI 對話
function removeChat() {
    DB().delete('chat','A14:A999').execute();
}

// 測試
function test(){

}
