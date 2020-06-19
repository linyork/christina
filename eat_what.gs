// 問吃什麼
function eatWhat() {
  var dataExport = {};
  var lastRow = sheetEat.getLastRow();
  var lastColumn = sheetEat.getLastColumn();
  var data = sheetEat.getRange(lastRow, lastColumn);
  for (var i = 1; i < data.length; i++) {
    dataExport[i] = data[0];
  }
  return dataExport[Math.floor(Math.random()*data.length + 1)];
}