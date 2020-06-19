// 取得讀取專案環境變數工具
const scriptProperties = PropertiesService.getScriptProperties();

// 設定Line token 資訊
const channelToken = scriptProperties.getProperty('LINE_API_KEY');

// 取得 admin
const adminString = scriptProperties.getProperty('ADMIN_SATRING');

// google sheet 資訊
const sheetId = scriptProperties.getProperty('SHEET_ID');
const christinaSheet = SpreadsheetApp.openById(sheetId);

// 取得 talbe
const sheetConsoleLog = christinaSheet.getSheetByName('consolelog');
const sheetEnv = christinaSheet.getSheetByName('env');