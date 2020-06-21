// h
const hScript = (event) => {
  if (getLineStatus()) {
    LineHelpers.replyBtnTemp(event.replyToken, '歡迎雇用 Christina', getCommandTemp())
  }
}
// cmd
const cmdScript = (event) => {
  if (getLineStatus()) {
    LineHelpers.replyMsg(event.replyToken, getCommandList(event.isMaster));
  }
}

// leave
const leaveScript = (event) => {
  if (getLineStatus()) {
    if (event.isMaster) {
      LineHelpers.replyMsg(event.replyToken, '主人掰掰~\nChristina 先行告退了~');
    } else {
      LineHelpers.replyMsg(event.replyToken, '掰掰~\nChristina 先行告退了~');
    }
    LineHelpers.leave(event.source.type, event.sourceId);
  }
}

// myid
const myidScript = (event) => {
  if (getLineStatus()) {
    if (event.isMaster) {
      LineHelpers.replyMsg(event.replyToken, '主人您的ID是：\n' + event.source.userId);
    } else {
      LineHelpers.replyMsg(event.replyToken, '好的~\n客倌你的ID是：\n' + event.source.userId);
    }
  }
}

// roll
const rollScript = (event) => {
  if (getLineStatus()) {
    if (event.isMaster) {
      LineHelpers.replyMsg(event.replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + roll());
    } else {
      LineHelpers.replyMsg(event.replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + roll());
    }
  }
}

// eat
const eatScript = (event) => {
  if (getLineStatus()) {
    if (event.isMaster) {
      LineHelpers.replyMsg(event.replyToken, 'Christina 覺得主人應該吃~\n' + eatWhat());
    } else {
      LineHelpers.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼~');
    }
  }
}

// start
const startScript = (event) => {
  if (event.isMaster) {
    if (getLineStatus() === true) {
      LineHelpers.replyMsg(event.replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
    } else {
      setLineStatus(true);
      LineHelpers.replyMsg(event.replyToken, 'Christina 開始上班～ \n主人有什麼事請吩咐～ \n要 Christina 下班請輸入 /end');
    }
  } else {
    LineHelpers.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定上班時間~');
  }
}

// end
const endScript = (event) => {
  if (event.isMaster) {
    if (getLineStatus() === true) {
      setLineStatus(false);
      LineHelpers.replyMsg(event.replyToken, 'Christina 暫時下班～ \n勿掛念～ \n要 Christina 上班請輸入 /start');
    } else {
      LineHelpers.replyMsg(event.replyToken, 'Christina 已經下班了喔~');
    }
  } else {
    LineHelpers.replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n讓客倌決定下班時間~');
  }
}

// 指令集
const masterCommand = {
  '/eat': {
    'name': '吃什麼',
    'fn': eatScript,
  },
  '/start': {
    'name': '啟動',
    'fn': startScript,
  },
  '/end': {
    'name': '結束',
    'fn': endScript,
  },
};
const guestCommand = {
  '/h': {
    'name': '基礎指令',
    'fn': hScript,
  },
  '/cmd': {
    'name': '指令列表',
    'fn': cmdScript,
  },
  '/leave': {
    'name': '離開',
    'fn': leaveScript,
  },
  '/myid': {
    'name': '顯示ID',
    'fn': myidScript,
  },
  '/roll': {
    'name': '擲骰子',
    'fn': rollScript,
  },
};
const allCommand = Object.assign(Object.assign({}, guestCommand), Object.assign({}, masterCommand));

// 取得指令字串
function getCommandList(isMaster) {
  var commandString = '';
  var commandList = {};
  if (isMaster) {
    commandString = '主人可以吩咐的事：\n';
    commandList = allCommand;
  } else {
    commandString = '主人授權你的事：\n';
    commandList = guestCommand;
  }
  for (var command in commandList) {
    commandString += command + '：' + commandList[command]['name'] + '\n';
  }
  return commandString;
}

// 基礎指令
function getCommandTemp() {
  var template = {};
  template.type = 'buttons';
  template.title = "開始使用 Christina";
  template.thumbnailImageUrl = 'https://api.reh.tw/line/bot/example/assets/images/example.jpg';
  template.text = '基礎指令清單';
  template.actions = [{
    "type": "message",
    "label": allCommand['/cmd'].name,
    "text": "/cmd"
  },{
    "type": "message",
    "label": allCommand['/leave'].name,
    "text": "/laeve"
  },{
    "type": "message",
    "label": allCommand['/start'].name,
    "text": "/start"
  },{
    "type": "message",
    "label": allCommand['/end'].name,
    "text": "/end"
  }];
  return template;
}

// 檢查身份
function checkMaster(userId) {
  var adminArray = adminString.split(",");
  return adminArray.includes(userId);
}

// 檢查是否是指令
function checkCommand(msg) {
  return msg.search(/^\//) !== -1;
}

// 擲骰子
function roll() {
  return Math.floor(Math.random() * 6 + 1);
}