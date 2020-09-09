import defaultAttributes from './defaultAttributes';
export const WorkTrip = `
type WorkTrip {
  ${defaultAttributes}
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  task: Task!
  type: TripType!
  assignedTo: BasicUser!
}
`

export const WorkTripQuerries = `
workTrips(taskId: Int!): [WorkTrip]
`

export const WorkTripMutations = `
addWorkTrip( order: Int!, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int!, assignedTo: Int! ): WorkTrip
updateWorkTrip( id: Int!, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int ): WorkTrip
deleteWorkTrip( id: Int! ): WorkTrip
`