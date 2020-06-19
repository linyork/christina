// 離開
function leave(sourceType, sourceId) {
  var url = 'https://api.line.me/v2/bot/' + sourceType + '/' + sourceId + '/leave';
  var opt = {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + channelToken,
    },
    'method': 'post',
  };
  UrlFetchApp.fetch(url, opt);
}

// 回覆訊息
function sendMsg(url, payload) {
  UrlFetchApp.fetch(url, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + channelToken,
    },
    'method': 'post',
    'payload': payload
  });
}

function replyMsg(replyToken, userMsg) {
  sendMsg('https://api.line.me/v2/bot/message/reply',
    JSON.stringify({
      'replyToken': replyToken,
      'messages': [{'type': 'text', 'text': userMsg}]
    }));
}

function pushMsg(usrId, message) {
  sendMsg('https://api.line.me/v2/bot/message/push', JSON.stringify({
    'to': usrId,
    'messages': [{'type': 'text', 'text': message}]
  }));
}

// Line helper
var LineHelpers = (function (helpers) {
  'use strict';
  helpers.getSourceId = function (source) {
    try {
      switch (source.type) {
        case 'user':
          return source.userId;
        case 'group':
          return source.groupId;
        case 'room':
          return source.roomId;
        default:
          console.log('LineHelpers, getSourceId, invalid source type!');
          break;
      }
    } catch (ex) {
      console.log('LineHelpers, getSourceId, ex = ' + ex);
    }
  };
  return helpers;
})(LineHelpers || {});