// Line 主程序
function doPost(e) {
    try {
        setLog(e.postData.contents);
        var value = JSON.parse(e.postData.contents);
        if (value.events != null) {
            for (var i in value.events) {
                Line.init(value.events[i]);
                Line.startEvent();
            }
        }
    } catch (e) {
        setLog(e);
    }
}