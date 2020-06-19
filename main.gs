// Line 主程序
function doPost(e) {
  try {
    setLog(e.postData.contents);
    var value = JSON.parse(e.postData.contents);
    var events = value.events;
    if (events != null) {
      for (var i in events) {
        var opt = {};
        opt.event = events[i];
        opt.type = opt.event.type;
        opt.replyToken = opt.event.replyToken; // 要回復訊息 reToken
        opt.sourceType = opt.event.source.type;
        opt.sourceId = LineHelpers.getSourceId(opt.event.source);
        opt.userId = opt.event.source.userId; // 取得個人userId
        opt.groupId = opt.event.source.groupId; // 取得群組Id
        opt.timeStamp = opt.event.timestamp;
        switch (opt.type) {
          case 'postback':
            break;
          case 'message':
            opt.messageType = opt.event.message.type;
            opt.messageId = opt.event.message.id;
            opt.messageText = opt.event.message.text;
            if( messageText in allCommand) {
              allCommand[messageText].fn(checkMaster(opt.userId), opt);
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