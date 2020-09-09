import defaultAttributes from './defaultAttributes';
export const CalendarEvent = `
type CalendarEvent {
  ${defaultAttributes}
  startsAt: String!
  endsAt: String!
  task: Task!
}
`

export const CalendarEventQuerries = `
calendarEvents(filterId: Int, projectId: Int, filter: FilterInput): [CalendarEvent]
`

export const CalendarEventMutations = `
addCalendarEvent( startsAt: String!, endsAt: String!, task: Int! ): CalendarEvent
updateCalendarEvent( id: Int!, startsAt: String, endsAt: String ): CalendarEvent
deleteCalendarEvent( id: Int! ): CalendarEvent
`
