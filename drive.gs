// google drive
var GoogleDrive = ((gd) => {

    
    var driveApp =  DriveApp;

    // 取得 drive 裡的圖片
    gd.getImageUrl = (name) => {
        var files = driveApp.getFilesByName(name+".jpg");
        while (files.hasNext()) {
            var file = files.next();
            var fileUrl = file.getUrl();
        }
        return fileUrl;
    };

    return gd;
})(GoogleDrive || {});

function getImageUrlTest(name) {
    var files = DriveApp.getFilesByName(name+".jpg");
    while (files.hasNext()) {
        var file = files.next();
        var fileUrl = file.getId();
    }
    return 'https://drive.google.com/uc?export=view&id='+fileUrl;
}


