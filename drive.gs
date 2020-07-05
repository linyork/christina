// google drive
var GoogleDrive = ((gd) => {
    var driveApp = DriveApp;

    /**
     * 取得圖片 從 google drive
     * @param name
     * @returns {*}
     */
    gd.getImageUrl = (name) => {
        try {
            var files = driveApp.getFilesByName(name + ".jpg");
            return (files.hasNext()) ? 'https://drive.google.com/uc?export=view&id=' + files.next().getId() : null;
        } catch (ex) {
            GoogleSheet().logError('GoogleDrive.getImageUrl, ex = ' + ex);
        }
    };

    return gd;
})(GoogleDrive || {});


