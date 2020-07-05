// Line
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
                    GoogleSheet().setLog('Line, getSourceId, invalid source type!');
                    break;
            }
        } catch (ex) {
            GoogleSheet().setLog('Line.getSourceId, ex = ' + ex);
        }
    };

    // 傳送 payload 給 line
    var sendMsg = (url, payload) => {
        GoogleSheet().setLog(payload);
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
            GoogleSheet().setLog('Line.sendMsg, ex = ' + ex);
        }
    };

    l.event = {};

    /**
     * 初始化 event 物件 從 line response
     * @param event
     */
    l.init = (event) => {
        try {
            event.isCommand = (event.message == null) ? false : Christina.checkCommand(event.message.text);
            event.command = (event.isCommand) ? Christina.getCommand(event.message.text) : "";
            event.commandParam = (event.message == null) ? false : Christina.getCommandParam(event.message.text);
            event.isMaster = Christina.checkMaster(event.source.userId);
            event.sourceId = getSourceId(event.source);
            event.lineStatus = GoogleSheet().lineStatus;
            Line.event = event;
        } catch (ex) {
            GoogleSheet().setLog('Line.eventInit, ex = ' + ex);
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
            GoogleSheet().setLog('Line.startEvent, ex = ' + ex);
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
            GoogleSheet().setLog('Line.pushMsg, ex = ' + ex);
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
            GoogleSheet().setLog('Line.replyMsg, ex = ' + ex);
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
            GoogleSheet().setLog('Line.replyBtnTemp, ex = ' + ex);
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
            GoogleSheet().setLog('Line.replyBtnTemp, ex = ' + ex);
        }
    };

    /**
     *     // 離開
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
            GoogleSheet().setLog('Line.leave, ex = ' + ex);
        }
    };

    return l;
})(Line || {});