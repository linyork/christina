// google drive
var GoogleDrive = ((gd) => {
    
    var driveApp =  DriveApp;

    // 取得 drive 裡的圖片
    gd.getImageUrl = (name) => {
        var files = driveApp.getFilesByName(name+".jpg");
        return (files.hasNext()) ? 'https://drive.google.com/uc?export=view&id='+files.next().getId() : null;
    };

    return gd;
})(GoogleDrive || {});


