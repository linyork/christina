// google drive
var GoogleDrive = ((gd) => {
    
    var driveApp =  DriveApp;

    // 取得 drive 裡的圖片
    gd.getImageUrl = (name) => {
        var files = driveApp.getFilesByName(name+".jpg");
        return (files.hasNext()) ? files.next.getDownloadUrl() : null;
    };

    return gd;
})(GoogleDrive || {});


