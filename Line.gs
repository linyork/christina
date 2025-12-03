/**
 * Line
 * @description LINE Bot API 操作模組
 */
var Line = (() => {
    var line = {};
    var channelToken = Config.LINE_CHANNEL_TOKEN;
    var channelSecret = Config.LINE_CHANNEL_SECRET;
    var apiBase = Config.LINE_API_BASE;

    line.event = {};

    /**
     * 驗證 LINE Webhook 簽章
     * @param {object} e - doPost 事件物件
     * @returns {boolean}
     */
    var verifySignature = (e) => {
        try {
            if (!channelSecret) return true; // 如果沒設定 secret 就跳過驗證

            var signature = e.parameter['X-Line-Signature'] || e.parameter['x-line-signature'];
            if (!signature) return false;

            var body = e.postData.contents;
            var hash = Utilities.computeHmacSha256Signature(
                Utilities.newBlob(body).getBytes(),
                channelSecret
            );
            var expectedSignature = Utilities.base64Encode(hash);

            return signature === expectedSignature;
        } catch (ex) {
            GoogleSheet.logError('Line.verifySignature', ex);
            return false;
        }
    };

    /**
     * 取得 Source ID
     * @param {object} source - LINE source 物件
     * @returns {string}
     */
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
                    GoogleSheet.logError('Line.getSourceId', 'invalid source type!');
                    return null;
            }
        } catch (ex) {
            GoogleSheet.logError('Line.getSourceId', ex);
            return null;
        }
    };

    /**
     * 取得個人資訊
     * @param {object} source - LINE source 物件
     * @returns {object}
     */
    var getProfile = (source) => {
        try {
            var profile = {};
            var url = '';

            switch (source.type) {
                case 'user':
                    url = apiBase + '/profile/' + source.userId;
                    break;
                case 'group':
                    url = apiBase + '/group/' + source.groupId + '/member/' + source.userId;
                    break;
                case 'room':
                    url = apiBase + '/room/' + source.roomId + '/member/' + source.userId;
                    break;
                default:
                    return { userId: null, displayName: null, pictureUrl: null };
            }

            profile = JSON.parse(UrlFetchApp.fetch(url, {
                'headers': { 'Authorization': 'Bearer ' + channelToken }
            }).getContentText());

            return profile;
        } catch (ex) {
            GoogleSheet.logError('Line.getProfile', ex);
            return { userId: null, displayName: null, pictureUrl: null };
        }
    };

    /**
     * 發送訊息給 LINE
     * @param {string} url - API URL
     * @param {string} payload - JSON payload
     */
    var sendMsg = (url, payload) => {
        GoogleSheet.logSend(payload);
        try {
            UrlFetchApp.fetch(url, {
                'headers': {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + channelToken
                },
                'method': 'post',
                'payload': payload
            });
        } catch (ex) {
            GoogleSheet.logError('Line.sendMsg', ex);
        }
    };

    /**
     * 檢查是否為 LINE 請求
     * @param {string} string - 請求內容
     * @returns {boolean}
     */
    line.isLine = (string) => {
        return Utils.isJsonString(string) && JSON.parse(string).hasOwnProperty("events");
    };

    /**
     * 初始化事件物件
     * @param {object} event - LINE 事件物件
     */
    line.init = (event) => {
        try {
            event.isMaster = Christina.checkMaster(event.source.userId);
            event.profile = getProfile(event.source);

            if (event.message === null || event.message === undefined) {
                event.isCommand = false;
                event.command = "";
                event.commandParam = [];
            } else {
                var cmdObj = Christina.checkCommand(event.message.text);
                event.isCommand = cmdObj.isCommand;
                event.command = cmdObj.command;
                event.commandParam = Christina.getCommandParam(event.message.text);
            }

            event.sourceId = getSourceId(event.source);
            event.lineStatus = GoogleSheet.lineStatus;
            line.event = event;
        } catch (ex) {
            GoogleSheet.logError('Line.init', ex);
        }
    };

    /**
     * 執行事件處理
     */
    line.startEvent = () => {
        try {
            switch (line.event.type) {
                case 'postback':
                    // 暫不動作
                    break;
                case 'message':
                    if (line.event.isCommand) {
                        if (line.event.lineStatus) {
                            if (line.event.commandParam.indexOf('help') !== -1 || line.event.commandParam.indexOf('h') !== -1) {
                                var commandHelp = Christina.allCommand[line.event.command].help;
                                line.replyMsg(line.event.replyToken, commandHelp.replace(/@user/, Christina.getName(line.event)));
                            } else if (line.event.commandParam.indexOf('alias') !== -1 || line.event.commandParam.indexOf('其他指令') !== -1) {
                                var commandName = Christina.allCommand[line.event.command].name;
                                var commandAlias = Christina.allCommand[line.event.command].alias.toString();
                                line.replyMsg(line.event.replyToken, commandName + "的其他指令有: " + commandAlias);
                            } else {
                                Christina.allCommand[line.event.command].fn(line.event);
                            }
                        } else if (!line.event.lineStatus && line.event.command === 'start') {
                            Christina.allCommand[line.event.command].fn(line.event);
                        } else {
                            line.replyMsg(line.event.replyToken, "Christina 下班了喔");
                        }
                    } else {
                        // ChatGPT Bot
                        if (line.event.isMaster) {
                            line.replyMsg(line.event.replyToken, ChatBot.reply(line.event.source.userId, line.event.message.text));
                        } else {
                            line.replyMsg(line.event.replyToken, "Christina 覺得困惑了");
                        }
                    }
                    break;
                case 'join':
                    line.pushMsg(line.event.sourceId, '大家好！我是 Christina！');
                    break;
                case 'leave':
                    // 暫不動作
                    break;
                case 'memberLeft':
                    line.pushMsg(line.event.sourceId, Christina.getName(line.event) + '離開了！我們緬懷他');
                    break;
                case 'memberJoined':
                    line.pushMsg(line.event.sourceId, Christina.getName(line.event) + '你好！我是 Christina');
                    break;
                case 'follow':
                    line.pushMsg(line.event.sourceId, Christina.getName(line.event) + '你好！我是 Christina');
                    break;
                case 'unfollow':
                    line.pushMsg(line.event.sourceId, '好可惜以後 Christina 會提供更多服務的');
                    break;
                default:
                    break;
            }
        } catch (ex) {
            GoogleSheet.logError('Line.startEvent', ex);
        }
    };

    /**
     * 推送文字訊息
     * @param {string} userId - 使用者 ID
     * @param {string} message - 訊息內容
     */
    line.pushMsg = (userId, message) => {
        try {
            sendMsg(apiBase + '/message/push', JSON.stringify({
                'to': userId,
                'messages': [{ 'type': 'text', 'text': message }]
            }));
        } catch (ex) {
            GoogleSheet.logError('Line.pushMsg', ex);
        }
    };

    /**
     * 回覆文字訊息
     * @param {string} replyToken - Reply Token
     * @param {string} message - 訊息內容
     */
    line.replyMsg = (replyToken, message) => {
        try {
            sendMsg(apiBase + '/message/reply', JSON.stringify({
                'replyToken': replyToken,
                'messages': [{ 'type': 'text', 'text': message }]
            }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyMsg', ex);
        }
    };

    /**
     * 回覆按鈕模板
     * @param {string} replyToken - Reply Token
     * @param {string} altText - 替代文字
     * @param {object} template - 模板物件
     */
    line.replyBtnTemp = (replyToken, altText, template) => {
        try {
            sendMsg(apiBase + '/message/reply', JSON.stringify({
                'replyToken': replyToken,
                'messages': [{
                    'type': 'template',
                    'altText': altText,
                    'template': template
                }]
            }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyBtnTemp', ex);
        }
    };

    /**
     * 回覆圖片
     * @param {string} replyToken - Reply Token
     * @param {string} originalUrl - 原始圖片 URL
     * @param {string} previewUrl - 預覽圖片 URL
     */
    line.replyImageTemp = (replyToken, originalUrl, previewUrl) => {
        try {
            sendMsg(apiBase + '/message/reply', JSON.stringify({
                'replyToken': replyToken,
                'messages': [{
                    'type': 'image',
                    'originalContentUrl': originalUrl,
                    'previewImageUrl': previewUrl
                }]
            }));
        } catch (ex) {
            GoogleSheet.logError('Line.replyImageTemp', ex);
        }
    };

    /**
     * 離開群組或聊天室
     * @param {string} sourceType - 來源類型 (group/room)
     * @param {string} sourceId - 來源 ID
     */
    line.leave = (sourceType, sourceId) => {
        try {
            UrlFetchApp.fetch(apiBase + '/' + sourceType + '/' + sourceId + '/leave', {
                'headers': {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': 'Bearer ' + channelToken
                },
                'method': 'post'
            });
        } catch (ex) {
            GoogleSheet.logError('Line.leave', ex);
        }
    };

    return line;
})();
