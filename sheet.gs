// 寫 log
function setLog(e) {
  var lastRow = sheetConsoleLog.getLastRow();
  sheetConsoleLog.getRange(lastRow + 1, 1).setValue(e);
}

// 讀取 env
function getEnv() {
  var data = sheetEnv.getSheetValues(1, 2, 1, 1);
  if (data[0][0].length) {
    return false;
  }
  return data[0][0];
}

// 寫env
function setEnv(data) {
  sheetEnv.getRange(1, 2).setValue(data);
}