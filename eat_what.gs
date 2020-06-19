// 問吃什麼
function eatWhat() {
  var dataExport = {};
  var lastRow = sheetEat.getLastRow()-1;
  var lastColumn = sheetEat.getLastColumn();
  var data = sheetEat.getRange(1,1,lastRow, lastColumn).getValues();
  for (var i = 1; i < data.length; i++) {
    dataExport[i] = data[1];
  }
  JSON.stringify(dataExport);

  return dataExport[Math.floor(Math.random() * data.length + 1)];
}