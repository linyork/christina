// google drive
var GoogleDrive = ((gd) => {
    
    var driveApp =  DriveApp;

    // 取得 drive 裡的圖片
    gd.getImageUrl = (name) => {
        var files = driveApp.getFilesByName(name);
        var fileUrl = "";
        while (files.hasNext()) {
            var file = files.next();
            fileUrl = 'https://drive.google.com/uc?export=view&id='+file.getId();
        }

        return fileUrl;
    };

    return gd;
})(GoogleDrive || {});


