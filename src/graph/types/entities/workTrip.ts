import defaultAttributes from './defaultAttributes';
export const WorkTrip = `
type WorkTrip {
  ${defaultAttributes}
  order: Int!
  done: Boolean!
  approved: Boolean!
  approvedBy: User
  quantity: Float!
  discount: Float!
  task: Task
  repeatTemplate: RepeatTemplate
  type: TripType!
  assignedTo: BasicUser!
  invoicedData: [InvoicedTrip]
  scheduled: ScheduledWork
}
`

export const WorkTripQuerries = `
workTrips(taskId: Int!): [WorkTrip]
`

export const WorkTripMutations = `
addWorkTrip( order: Int!, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int!, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
updateWorkTrip( id: Int!, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
deleteWorkTrip( id: Int! ): WorkTrip

addRepeatTemplateWorkTrip( order: Int!, done: Boolean!, quantity: Float!, discount: Float!, repeatTemplate: Int!, type: Int!, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
updateRepeatTemplateWorkTrip( id: Int!, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
deleteRepeatTemplateWorkTrip( id: Int! ): WorkTrip
`
