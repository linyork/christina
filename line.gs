// Line
var Line = ((l) => {
    /**
     * private member
     * 環境相關
     */
    var scriptProperties = PropertiesService.getScriptProperties();

    // 取得 Line token
    var channelToken = scriptProperties.getProperty('LINE_API_KEY');

    // 取得該所在地 SourceId
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
                    GoogleSheet.setLog('Line, getSourceId, invalid source type!');
                    break;
            }
        } catch (ex) {
            GoogleSheet.setLog('Line, getSourceId, ex = ' + ex);
        }
    };

    // 傳送 payload
    var sendMsg = (url, payload) => {
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
            GoogleSheet.setLog('Line, sendMsg, ex = ' + ex);
        }
    };

    /**
     * public member
     * Line 工具
     */
    // line event object
    l.event = {};

    // 初始化 event 物件
    l.init = (event) => {
        try {
            if (event.message != null) {
                event.isCommand = Christina.checkCommand(event.message.text);
            } else {
                event.isCommand = false;
            }
            event.isMaster = Christina.checkMaster(event.source.userId);
            event.sourceId = getSourceId(event.source);
            // event類型
            // event.type;
            // 要回復訊息 reToken
            // event.replyToken
            // 說話人的類型 group room user
            // event.source.type
            // 說話人的 userId
            // event.source.userId
            // 取得群組Id
            // event.source.groupId
            // 時間
            // event.timestamp
            Line.event = event;
        } catch (ex) {
            GoogleSheet.setLog('Line, eventInit, ex = ' + ex);
        }
    };

    // 執行 event 事件
    l.startEvent = () => {
        try {
            switch (Line.event.type) {
                case 'postback':
                    break;
                case 'message':
                    // event.messageType = event.message.type;
                    // event.messageId = event.message.id;
                    // event.messageText = event.message.text;
                    if (Line.event.message.text in Christina.allCommand) {
                        Christina.allCommand[Line.event.message.text].fn(Line.event);

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
            GoogleSheet.setLog('Line, startEvent, ex = ' + ex);
        }
    };

    // 回覆按鈕模板
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
            GoogleSheet.setLog('Line, replyBtnTemp, ex = ' + ex);
        }
    };

    // 回覆文字訊息
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
            GoogleSheet.setLog('Line, replyMsg, ex = ' + ex);
        }
    };

    // 發送文字訊息
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
            GoogleSheet.setLog('Line, pushMsg, ex = ' + ex);
        }
    };

    // 離開
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
            GoogleSheet.setLog('Line, leave, ex = ' + ex);
        }
    };

    return l;
})(Line || {});