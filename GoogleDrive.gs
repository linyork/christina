/**
 * GoogleDrive
 * @description Google Drive 操作模組
 */
var GoogleDrive = (() => {
    var googleDrive = {};
    var driveApp = DriveApp;

    // 檔案 URL 快取
    var cache = CacheService.getScriptCache();
    var CACHE_EXPIRATION = 21600; // 6 小時

    /**
     * 取得圖片 URL 從 Google Drive (帶快取)
     * @param {string} name - 檔案名稱
     * @returns {string|null} 圖片 URL
     */
    googleDrive.getImageUrl = (name) => {
        try {
            // 先檢查快取
            var cacheKey = 'drive_img_' + name;
            var cachedUrl = cache.get(cacheKey);

            if (cachedUrl) {
                return cachedUrl;
            }

            // 快取未命中，從 Drive 取得
            var files = driveApp.getFilesByName(name);
            if (files.hasNext()) {
                var url = 'https://lh3.googleusercontent.com/d/' + files.next().getId();
                // 存入快取
                cache.put(cacheKey, url, CACHE_EXPIRATION);
                return url;
            } else {
                return null;
            }
        } catch (ex) {
            GoogleSheet.logError('GoogleDrive.getImageUrl', ex);
            return null;
        }
    };

    return googleDrive;
})();
