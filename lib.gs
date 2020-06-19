// 指令集
const masterCommand = {
  '/eat': '吃什麼',
  '/start': '啟動',
  '/end': '結束',
};
const guestCommand = {
  '/command': '指令列表',
  '/leave': '離開',
  '/myid': '顯示ID',
  '/roll': '擲骰子',
};

// const masterCommandTest = {
//   '/eat': {
//     'name': '吃什麼',
//     'fn': eatScript(isMaster, opt),
//   },
//   '/start': {
//     'name': '啟動',
//     'fn': startScript(isMaster, opt)
//   },
//   '/end': {
//     'name': '結束',
//     'fn': endScript(isMaster, opt)
//   },
// };
// const guestCommandTest = {
//   '/command': {
//     'name': '指令列表',
//     'fn': commandScript(isMaster, opt)
//   },
//   '/leave': {
//     'name': '離開',
//     'fn': leaveScript(isMaster, opt)
//   },
//   '/myid': {
//     'name': '顯示ID',
//     'fn': myidScript(isMaster, opt)
//   },
//   '/roll': {
//     'name': '擲骰子',
//     'fn': rollScript(isMaster, opt)
//   },
// };

// // command
// function commandScript(isMaster, opt) {
//   return replyMsg(opt.replyToken, getCommandList(isMaster));
// }
//
// // leave
// function leaveScript(isMaster, opt) {
//   if (isMaster) {
//     replyMsg(opt.replyToken, '主人掰掰~\nChristina 先行告退了~');
//     leave(opt.sourceType, opt.sourceId);
//   } else {
//     replyMsg(opt.replyToken, '掰掰~\nChristina 先行告退了~');
//     leave(opt.sourceType, opt.sourceId);
//   }
// }
//
// // myid
// function myidScript(isMaster, opt) {
//   if (isMaster) {
//     replyMsg(opt.replyToken, '主人您的ID是：\n' + userId);
//   } else {
//     replyMsg(opt.replyToken, '好的~\n客倌你的ID是：\n' + userId);
//   }
// }
//
// // roll
// function rollScript(isMaster, opt) {
//   if (isMaster) {
//     replyMsg(opt.replyToken, '好的 Christina 為主人擲骰子~\n擲出的點數是: ' + roll());
//   } else {
//     replyMsg(opt.replyToken, '好的 Christina 為客倌擲骰子~\n擲出的點數是: ' + roll());
//   }
// }
//
// // eat
// function eatScript(isMaster, opt) {
//   if (isMaster) {
//     replyMsg(opt.replyToken, 'Christina 覺得主人應該吃~\n' + eatWhat());
//   }
// }
//
// // start
// function startScript(isMaster, opt) {
//   if (isMaster && getLineStatus() === true) {
//     replyMsg(opt.replyToken, 'Christina 在這兒～ \n主人有什麼吩咐嗎～');
//   }
//   if (isMaster && getLineStatus() === false) {
//     setLineStatus(true);
//     replyMsg(opt.replyToken, 'Christina 打擾了～ \n主人有什麼事請吩咐～ \n要 Christina 迴避請輸入 /end');
//   }
// }
//
// // end
// function endScript(isMaster, opt) {
//   if (isMaster && getLineStatus() === true) {
//     setLineStatus(false);
//     replyMsg(opt.replyToken, 'Christina 暫時迴避～ \n勿掛念～ \n要 Christina 回來請輸入 /start');
//   }
//   if (isMaster && getLineStatus() === false) {
//     replyMsg(opt.replyToken, 'Christina 已經離開了喔~');
//   }
// }

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
    commandString += command + '\t\t' + commandList[command] + '\n';
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