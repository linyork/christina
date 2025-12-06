/**
 * GeminiService
 * @description 負責與 Gemini API 進行通訊的底層服務
 */
var GeminiService = (() => {
    var service = {};

    /**
     * 呼叫 Gemini API
     * @param {array} contents - 對話內容 (Gemini 格式)
     * @param {array} tools - 工具定義 (可選)
     * @returns {object} API 回應
     */
    service.callAPI = (contents, tools) => {
        try {
            var url = Config.GEMINI_API_BASE + '/models/' + Config.GEMINI_MODEL + ':generateContent?key=' + Config.GEMINI_API_KEY;

            var payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 2048,
                    "topP": 0.95
                }
            };

            // 如果有提供工具定義，加入 payload
            if (tools && tools.length > 0) {
                payload.tools = [{
                    "functionDeclarations": tools
                }];
            }

            var options = {
                "method": "post",
                "contentType": "application/json",
                "payload": JSON.stringify(payload),
                "muteHttpExceptions": true
            };

            var response = UrlFetchApp.fetch(url, options);
            var responseCode = response.getResponseCode();

            if (responseCode !== 200) {
                GoogleSheet.logError('GeminiService.callAPI', 'API Error: ' + responseCode, response.getContentText());
                return null;
            }

            var responseText = response.getContentText();
            return JSON.parse(responseText);
        } catch (error) {
            GoogleSheet.logError('GeminiService.callAPI', error);
            return null;
        }
    };

    return service;
})();
