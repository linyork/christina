// google drive
var GoogleDrive = ((gd) => {

    /**
     * private member
     */
    var driveApp = DriveApp;

    /**
     * public member
     */
    // 取得圖片 從 google drive
    gd.getImageUrl = (name) => {
        try {
            var files = driveApp.getFilesByName(name + ".jpg");
            return (files.hasNext()) ? 'https://drive.google.com/uc?export=view&id=' + files.next().getId() : null;
        } catch (ex) {
            GoogleSheet.setLog('GoogleDrive.getImageUrl, ex = ' + ex);
        }
    };

    return gd;
})(GoogleDrive || {});


