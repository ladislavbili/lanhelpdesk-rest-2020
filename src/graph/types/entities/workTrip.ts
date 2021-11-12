import defaultAttributes from './defaultAttributes';
export const WorkTrip = `
type WorkTrip {
  ${defaultAttributes}
  order: Int!
  done: Boolean!
  approved: Boolean!
  quantity: Float!
  discount: Float!
  price: Float
  total: Float

  approvedBy: User
  task: Task
  repeatTemplate: RepeatTemplate
  type: TripType!
  assignedTo: BasicUser!
  scheduled: ScheduledWork
}
`

export const WorkTripQueries = `
workTrips(taskId: Int!, fromInvoice: Boolean ): [WorkTrip]
`

export const WorkTripMutations = `
addWorkTrip( order: Int!, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput, fromInvoice: Boolean ): WorkTrip
updateWorkTrip( id: Int!, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput, fromInvoice: Boolean ): WorkTrip
deleteWorkTrip( id: Int!, fromInvoice: Boolean ): WorkTrip

addRepeatTemplateWorkTrip( order: Int!, done: Boolean!, quantity: Float!, discount: Float!, repeatTemplate: Int!, type: Int!, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
updateRepeatTemplateWorkTrip( id: Int!, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): WorkTrip
deleteRepeatTemplateWorkTrip( id: Int! ): WorkTrip
`
