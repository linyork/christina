var Test = (() => {
    var test = {};

    test.testCalendar = () => {
        console.log('Testing Calendar Access...');
        try {
            var cal = CalendarApp.getDefaultCalendar();
            var events = cal.getEventsForDay(new Date());
            console.log('Successfully accessed calendar. Events today: ' + events.length);
        } catch (e) {
            console.error('Calendar access failed: ' + e.toString());
        }
    };

    return test;
})();

function runTestCalendar() {
    Test.testCalendar();
}
