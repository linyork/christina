// 指令集
const masterCommand = {
  '/eat': '吃什麼',
  '/start': '啟動',
  '/end': '結束',
};
const guestCommand = {
  '/system call': '指令列表',
  '/leave': '離開',
  '/myid': '顯示ID',
  '/roll': '擲骰子',
}

// 取得指令字串
function getCommandList(isMaster) {
  var commandString = '';
  var commandList = {};
  if (isMaster) {
    commandString = '主人可以吩咐的事：\n ';
    commandList = Object.assign(guestCommand, masterCommand);
  } else {
    commandString = '主人授權你的事：\n ';
    commandList = guestCommand;
  }
  for (var command in commandList) {
    commandString += ' ```'+commandList[command]+'``` '+command+'\n';
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