// Line 主程序
function doPost(e) {
  try {
    setLog(e.postData.contents);
    var value = JSON.parse(e.postData.contents);
    if (value.events != null) {
      for (var i in value.events) {
        var event = LineHelpers.eventInit(value.events[i]);
        LineHelpers.startEvent(event);
      }
    }
  } catch (e) {
    setLog(e);
  }
}