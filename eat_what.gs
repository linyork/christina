// 問吃什麼
function eatWhat() {
  var dataExport = {};
  var lastRow = sheetEat.getLastRow();
  var lastColumn = sheetEat.getLastColumn();
  var data = sheetEat.getRange(1, 1, lastRow, lastColumn).getValues();
  for (var i = 0; i <= data.length; i++) {
    dataExport[i] = data[i];
  }
  return dataExport[Math.floor(Math.random() * data.length)];
}