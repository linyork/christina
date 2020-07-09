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
            return (files.hasNext()) ? 'https://doc-0o-5s-docs.googleusercontent.com/docs/securesc/jffh3mil31rq9j88ior8qi12fuejkuoc/n1lqjcmjitu3po24vdiqhe326vj0ffgq/1594259775000/15795760426779374456/15795760426779374456/' + files.next().getId() : null;
        } catch (ex) {
            GoogleSheet().logError('GoogleDrive.getImageUrl, ex = ' + ex);
        }
    };


    return gd;
})(GoogleDrive || {});


