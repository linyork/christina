// 問吃什麼
function eatWhat() {
  var dataExport = {};
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  var data = sheet.getRange(lastRow, lastColumn);
  for (var i = 1; i < data.length; i++) {
    dataExport[i] = data[0];
  }
  return dataExport[Math.floor(Math.random()*data.length + 1)];
}