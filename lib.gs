// cmd
const cmdScript = (isMaster, event) => {
  if (getLineStatus()) {
    return replyMsg(event.replyToken, getCommandList(isMaster));
  }
}

// leave
const leaveScript = (isMaster, event) => {
  if (getLineStatus()) {
    if (isMaster) {
      replyMsg(event.replyToken, '主人掰掰~\nChristina 先行告退了~');
      leave(event.source.type, event.sourceId);
    } else {
      replyMsg(event.replyToken, '掰掰~\nChristina 先行告退了~');
      leave(event.source.type, event.sourceId);
    }
  }
}

// myid
const myidScript = (isMaster, event) => {
  if (getLineStatus()) {
    if (isMaster) {
      replyMsg(event.replyToken, '主人您的ID是：\n' + event.source.userId);
    } else {
      replyMsg(event.replyToken, '好的~\n客倌你的ID是：\n' + event.source.userId);
    }
  }
}

// roll
const rollScript = (isMaster, event) => {
  if (getLineStatus()) {
    if (isMaster) {
      replyMsg(event.replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + roll());
    } else {
      replyMsg(event.replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + roll());
    }
  }
}

// eat
const eatScript = (isMaster, event) => {
  if (getLineStatus()) {
    if (isMaster) {
      replyMsg(event.replyToken, 'Christina 覺得主人應該吃~\n' + eatWhat());
    } else {
      replyMsg(event.replyToken, 'Christina 還沒獲得主人同意~\n來幫客倌決定要吃什麼~');
    }
  }
}

// start
const startScript = (isMaster, event) => {
  if (isMaster) {
    if (getLineStatus() === true) {
      replyMsg(event.replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
    } else {
      setLineStatus(true);
      replyMsg(event.replyToken, 'Christina 打擾了～ \n主人有什麼事請吩咐～ \n要 Christina 迴避請輸入 /end');
    }
  }
}

// end
const endScript = (isMaster, event) => {
  if (isMaster) {
    if (getLineStatus() === true) {
      setLineStatus(false);
      replyMsg(event.replyToken, 'Christina 暫時迴避～ \n勿掛念～ \n要 Christina 回來請輸入 /start');
    } else {
      setLineStatus(true);
      replyMsg(event.replyToken, 'Christina 已經離開了喔~');
    }
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
    commandList = Object.assign(guestCommand, masterCommand);
  } else {
    commandString = '主人授權你的事：\n';
    commandList = guestCommand;
  }
  for (var command in commandList) {
    commandString += command + '：' + commandList[command]['name'] + '\n';
  }
  return commandString;
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