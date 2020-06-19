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
            if (checkMaster(userId) && getLineStatus() === false && messageText === '/start') {
              setLineStatus(true);
              replyMsg(replyToken, 'Christina 打擾了～ \n主人有什麼事請吩咐～ \n要 Christina 迴避請輸入 /end');
            } else if (checkMaster(userId) && getLineStatus() === false && messageText === '/end') {
              replyMsg(replyToken, 'Christina 已經離開了喔~');
            } else if (checkMaster(userId) && getLineStatus() === true && messageText === '/end') {
              setLineStatus(false);
              replyMsg(replyToken, 'Christina 暫時迴避～ \n勿掛念～ \n要 Christina 回來請輸入 /start');
            } else if (checkMaster(userId) && getLineStatus() === true && messageText === '/start') {
              replyMsg(replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
              // line bot 關閉
            } else if (getLineStatus() === false) {
              return;
              // is admin
            } else if (checkMaster(userId)) {
              if (checkCommand(messageText) === true) {
                switch (messageText) {
                  case '/command':
                    replyMsg(replyToken, getCommandList(checkMaster(userId)));
                    break;
                  case '/leave':
                    replyMsg(replyToken, '主人掰掰~\nChristina 先行告退了~');
                    leave(sourceType, sourceId);
                    break;
                  case '/myid':
                    replyMsg(replyToken, '主人您的ID是：\n' + userId);
                    break;
                  case '/roll':
                    replyMsg(replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + roll());
                    break;
                  case '/eat':
                    replyMsg(replyToken, 'Christina 覺得主人應該吃~\n' + eatWhat());
                    break;
                  default:
                    replyMsg(replyToken, '等主人回家教我了～');
                }
              } else {
                // replyMsg(replyToken, '主人說：\n' + messageText);
              }
              // not admin
            } else {
              if (checkCommand(messageText) === true) {
                switch (messageText) {
                  case '/command':
                    replyMsg(replyToken, getCommandList(checkMaster(userId)));
                    break;
                  case '/leave':
                    replyMsg(replyToken, '掰掰~\nChristina 先行告退了~');
                    leave(sourceType, sourceId);
                    break;
                  case '/myid':
                    replyMsg(replyToken, '好的~\n客倌你的ID是：\n' + userId);
                    break;
                  case '/roll':
                    replyMsg(replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + roll());
                    break;
                  default:
                    replyMsg(replyToken, '客官不可以～\n再這樣我要叫了喔');
                }
              } else {
                // replyMsg(replyToken, '客官說：\n' + messageText);
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
  } catch (e) {
    setLog(e);
  }
}