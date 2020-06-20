// Line helper
var LineHelpers = (function (helpers) {
  // 初始化 event 物件
  helpers.eventInit = (event) => {
    try {
      event.isCommand = checkCommand(event.message.text);
      event.isMaster = checkMaster(event.source.userId);
      event.sourceId = this.getSourceId(event.source);
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
      return event;
    } catch (ex) {
      setLog('LineHelpers, eventInit, ex = ' + ex);
    }
  };

  // 取得該所在地 SourceId
  helpers.getSourceId = (source) => {
    try {
      switch (source.type) {
        case 'user':
          return source.userId;
        case 'group':
          return source.groupId;
        case 'room':
          return source.roomId;
        default:
          setLog('LineHelpers, getSourceId, invalid source type!');
          break;
      }
    } catch (ex) {
      setLog('LineHelpers, getSourceId, ex = ' + ex);
    }
  };

  // 執行 event 事件
  helpers.startEvent = (event) => {
    try {
      switch (event.type) {
        case 'postback':
          break;
        case 'message':
          // event.messageType = event.message.type;
          // event.messageId = event.message.id;
          // event.messageText = event.message.text;
          if (event.message.text in allCommand) {
            allCommand[event.message.text].fn(event.isMaster, event);
          } else if (event.isCommand && event.isMaster === true) {
            replyMsg(event.replyToken, '等主人回家教我了～');
          } else if (event.isCommand && event.isMaster === false) {
            replyMsg(event.replyToken, '客官不可以～\n再這樣我要叫了喔');
          }
          break;
        case 'join':
          pushMsg(sourceId, 'Hello！我是貼身助理 Christina');
          break;
        case 'leave':
          pushMsg(sourceId, 'Good Bye！');
          break;
        case 'memberLeft':
          pushMsg(sourceId, 'Bye！');
          break;
        case 'memberJoined':
          pushMsg(sourceId, 'Hello！我是貼身助理 Christina');
          break;
        case 'follow':
          pushMsg(sourceId, 'Hello！我是貼身助理 Christina');
          break;
        case 'unfollow':
          pushMsg(sourceId, 'Bye bye！');
          break;
        default:
          break;
      }
    } catch (ex) {
      setLog('LineHelpers, startEvent, ex = ' + ex);
    }
  };

  // 回覆
  helpers.replyMsg = (replyToken, userMsg) => {
    try {
      this.sendMsg('https://api.line.me/v2/bot/message/reply',
        JSON.stringify({
          'replyToken': replyToken,
          'messages': [{'type': 'text', 'text': userMsg}]
        }));
    } catch (ex) {
      setLog('LineHelpers, replyMsg, ex = ' + ex);
    }
  }

  // 發送
  helpers.pushMsg = (usrId, message) => {
    try {
      this.sendMsg('https://api.line.me/v2/bot/message/push', JSON.stringify({
        'to': usrId,
        'messages': [{'type': 'text', 'text': message}]
      }));
    } catch (ex) {
      setLog('LineHelpers, pushMsg, ex = ' + ex);
    }
  }

  // 傳送 payload
  helpers.sendMsg = (url, payload) => {
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
      setLog('LineHelpers, sendMsg, ex = ' + ex);
    }
  }

  // 離開
  helpers.leave = (sourceType, sourceId) => {
    try {
      var url = 'https://api.line.me/v2/bot/' + sourceType + '/' + sourceId + '/leave';
      UrlFetchApp.fetch(url, {
        'headers': {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer ' + channelToken,
        },
        'method': 'post',
      });
    } catch (ex) {
      setLog('LineHelpers, leave, ex = ' + ex);
    }
  }
  return helpers;
})(LineHelpers || {});