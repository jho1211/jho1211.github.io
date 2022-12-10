/* Event System Module */

/*

Will show an event on the calendar by editing the desired column
colspan = (end - start) / timeLength

The Event will have the name of the event, day of the event (Mon-Sun), start date, and end date

By default, all events will be shown on the calendar

There will be a button to toggle events view, top right of the calendar:
- different modes:
    hide
    show all events
    show assigned events

Events that fit the TAs availability will be highlighted
    - same green color?

Events that the TA is already assigned to will be indicated with a symbol

When clicking on one of the events on the calendar, it will open a modal where:
- Title of event in bold or bigger font
- Start and end of event: DDD HH:MM - DDD HH:MM
- you can see a more detailed description of the event
- the TAs that have already been assigned
- a button to add an additional TA to the event
- a button to edit/delete the event

Initialize (initialize function:
- Load all calendar events

Onchange TA select (loadTAAvailability function):
* do it in this order so that assigned events will be colored last *
- Highlight all available events for that TA
- Highlight all assigned events for that TA

Highlight all available events:
- document.getElementsByClassName
    - Create a special class for the events modals
- Iterate through each element and set the modal color to color-success

Highlight all assigned events:
- Iterate through the events that the TA are assigned to (ta.events)
- for each one do the following:
    - document.getElementById
        - Special ID for each event
    - Add a yellow star to the innerHTML
        - img/star.svg (need to color yellow)

*/

class CalendarEvent {
    // An event has a name, day, start time, and end time
    constructor(name, day, start, end){
        this.name = name;
        this.day = day;
        this.start = start;
        this.end = end;
        this.description = ""
    }
}