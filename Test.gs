/**
 * 測試 Gemini API 並列出可用的模型
 */
function testGeminiAPI() {
    try {
        var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

        if (!apiKey) {
            Logger.log('錯誤：GEMINI_API_KEY 未設定');
            return;
        }

        // 測試 v1beta 版本
        Logger.log('=== 測試 v1beta 版本 ===');
        var urlBeta = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey;
        try {
            var responseBeta = UrlFetchApp.fetch(urlBeta);
            var dataBeta = JSON.parse(responseBeta.getContentText());
            Logger.log('v1beta 可用模型：');
            if (dataBeta.models) {
                dataBeta.models.forEach(function (model) {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        Logger.log('  - ' + model.name);
                    }
                });
            }
        } catch (ex) {
            Logger.log('v1beta 錯誤：' + ex);
        }

        // 測試 v1 版本
        Logger.log('\n=== 測試 v1 版本 ===');
        var urlV1 = 'https://generativelanguage.googleapis.com/v1/models?key=' + apiKey;
        try {
            var responseV1 = UrlFetchApp.fetch(urlV1);
            var dataV1 = JSON.parse(responseV1.getContentText());
            Logger.log('v1 可用模型：');
            if (dataV1.models) {
                dataV1.models.forEach(function (model) {
                    if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
                        Logger.log('  - ' + model.name);
                    }
                });
            }
        } catch (ex) {
            Logger.log('v1 錯誤：' + ex);
        }

        // 測試 generateContent
        Logger.log('\n=== 測試 generateContent ===');
        var testUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey;
        var testPayload = {
            "contents": [{
                "parts": [{ "text": "Say hello" }]
            }]
        };

        try {
            var testResponse = UrlFetchApp.fetch(testUrl, {
                "method": "post",
                "contentType": "application/json",
                "payload": JSON.stringify(testPayload),
                "muteHttpExceptions": true
            });

            Logger.log('測試回應狀態：' + testResponse.getResponseCode());
            Logger.log('測試回應內容：' + testResponse.getContentText());
        } catch (ex) {
            Logger.log('測試錯誤：' + ex);
        }

    } catch (error) {
        Logger.log('整體錯誤：' + error);
    }
}
