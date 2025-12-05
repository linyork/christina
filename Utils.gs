/**
 * Utils
 * @description 工具函數模組
 */
var Utils = (() => {
    var utils = {};

    /**
     * 解碼 HTML 實體
     * @param {string} strEncoded - 編碼的字串
     * @returns {string} 解碼後的字串
     */
    var unentitize = (strEncoded) => {
        return strEncoded
            && XmlService.parse(
                '<z>' + (strEncoded + '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</z>'
            ).getRootElement().getText();
    };

    /**
     * 取得 HTML Meta 資訊
     * @param {string} url - 網址
     * @returns {{title: string, description: string, keywords: string, metas: object}}
     */
    utils.getHtmlMeta = (url) => {
        try {
            var strXML = UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText();
            var metas = {};
            var result = {
                title: unentitize((/\<title\>(.+?)\<\/title\>/i.exec(strXML) || [])[1]),
                metas: metas
            };
            strXML.replace(/\<meta(?=[^\>]*\sname=\"([^\"]*)\")(?=[^\>]*\scontent=\"([^\"]*)\")[^\>]*\/?\>/ig,
                (m, name, content) => {
                    metas[name = unentitize(name)] = content = unentitize(content);
                    if (/^description$/i.test(name)) {
                        result.description = content;
                    } else if (/^keywords?$/i.test(name)) {
                        result.keywords = content;
                    }
                });
            strXML.replace(/\<meta(?=[^\>]*\sproperty=\"([^\"]*)\")(?=[^\>]*\scontent=\"([^\"]*)\")[^\>]*\/?\>/ig,
                (m, name, content) => {
                    metas[name = unentitize(name)] = content = unentitize(content);
                    if (/^description$/i.test(name)) {
                        result.description = content;
                    } else if (/^keywords?$/i.test(name)) {
                        result.keywords = content;
                    }
                });
            return result;
        } catch (ex) {
            GoogleSheet.logError('Utils.getHtmlMeta', ex);
            return null;
        }
    };

    /**
     * 檢查是否為 JSON 字串
     * @param {string} str - 要檢查的字串
     * @returns {boolean}
     */
    utils.isJsonString = (str) => {
        if (typeof str === 'string') {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    };

    /**
     * 檢查是否為主人
     * @param {string} userId - 使用者 ID
     * @returns {boolean}
     */
    utils.checkMaster = (userId) => {
        try {
            var adminArray = Config.ADMIN_STRING.split(",");
            return adminArray.includes(userId);
        } catch (ex) {
            GoogleSheet.logError('Utils.checkMaster', ex);
            return false;
        }
    };

    return utils;
})();
