const scriptProperties = PropertiesService.getScriptProperties();
const env = {};

// 設定Line token 資訊
const channelToken = scriptProperties.getProperty('LINE_API_KEY');

// 取得 admin
const adminString = scriptProperties.getProperty('ADMIN_SATRING');

// google sheet 資訊
const sheetId = scriptProperties.getProperty('SHEET_ID');
const christinaSheet = SpreadsheetApp.openById(sheetId);

// 取得 talbe
const sheetConsoleLog = christinaSheet.getSheetByName('consolelog');
const sheetEnv = christinaSheet.getSheetByName('env');


// 離開
function leave(sourceType, sourceId){
  var url = 'https://api.line.me/v2/bot/' + sourceType + '/' + sourceId+ '/leave';
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
          break;
        case 'group':
          return source.groupId;
          break;
        case 'room':
          return source.roomId;
          break;
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

// 寫 log
function setLog(e) {
  var lastRow = sheetConsoleLog.getLastRow();
  sheetConsoleLog.getRange(lastRow+1, 1).setValue(e);
}

// 讀取 env
function getEnv() {
  var data = sheetEnv.getSheetValues(1, 2, 1,1);
  if(data[0][0].length) {
    return false;
  }
  return data[0][0];
}

// 寫env 
function setEnv( data ) {
  sheetEnv.getRange(1, 2).setValue(data);
}

// 檢查身份
function checkMaster(userId) {
  var adminArray = adminString.split(",");
  return adminArray.includes(userId);
}

// 檢查是否是指令
function checkCommand(msg) {
  regularRule = /^\//;
  if(msg.search(regularRule)!= -1) {
    return true;
  } else {
    return false
  }
}

// Line 主程序
function doPost(e) {
  try {
    setLog(e.postData.contents);
    var value = JSON.parse(e.postData.contents);
    var events = value.events;
    if (events != null) {
      for (var i in events) {
        var event = events[i];
        var type = event.type;
        var replyToken = event.replyToken; // 要回復訊息 reToken
        var sourceType = event.source.type;
        var sourceId = LineHelpers.getSourceId(event.source);
        var userId = event.source.userId; // 取得個人userId
        var groupId = event.source.groupId; // 取得群組Id
        var timeStamp = event.timestamp;
        switch (type) {
          case 'postback':
            break;
          case 'message':
            var messageType = event.message.type;
            var messageId = event.message.id;
            var messageText = event.message.text; // 使用者的 Message_字串
            // status 機制
            if( checkMaster(userId) && getEnv() === false && messageText === '/start') {
              setEnv(true);
              replyMsg(replyToken, 'Christina 打擾了～ \n主人有什麼事請吩咐～ \n要 Christina 迴避請輸入 /end');
            }else if( checkMaster(userId) && getEnv() === true && messageText ==='/end') {
              setEnv(false);
              replyMsg(replyToken, 'Christina 暫時迴避～ \n勿掛念～ \n要 Christina 回來請輸入 /start');
            }else if( getEnv() === false) {
              return;
              // 是主人 是命令
            }else if( checkMaster(userId) ) {
              if(checkCommand(messageText) === true) {
                switch (messageText) {
                  case '/system call':
                    replyMsg(replyToken, '主人可以吩咐的事：\n/start\t啟動\n/end\t結束\n/leave\t離開\n/myid\t顯示ID');
                    break;
                  case '/leave':
                    leave(sourceType, sourceId);
                    break;
                  case '/myid':
                    replyMsg(replyToken, '主人您的ID是：\n' + userId);
                  default:
                    replyMsg(replyToken, '等主人回家教我了～');
                }
              }else{
                replyMsg(replyToken, '主人說：\n' + messageText);
              }
              // 他人
            } else {
              if(checkCommand(messageText) === true) {
                switch (messageText) {
                  case '/system call':
                    replyMsg(replyToken, '主人授權你的事：\n/leave\t離開\n/myid\t顯示ID');
                    break;
                  case '/leave':
                    leave(sourceType, sourceId);
                    break;
                  case '/myid':
                    replyMsg(replyToken, '好的~\n你的ID是：\n' + userId);
                    break;
                  default:
                    replyMsg(replyToken, '客官不可以～\n再這樣我要叫了喔');
                }
              } else {
                replyMsg(replyToken, '客官說：\n' + messageText);
              }
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
      }
    }
  } catch(e) {
    setLog(e);
  }
}