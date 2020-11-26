import defaultAttributes from './defaultAttributes';

export const UserInvoice = `
type InvoicedUser {
  user: User!
  subtasksHours: Int!
  tripsHours: Int!
}

type UserInvoice {
  user: BasicUser!
  fromDate: String!
  toDate: String!
  subtaskTasks: [InvoicedTask]!
  tripTasks: [InvoicedTask]!
  subtaskTotals: [UISubtaskTotal]!
  tripTotals: [UITripTotal]!
  subtaskCounts: UISubtaskCounts!
  tripCounts: UITripCounts!
  typeTotals: UITypeTotals!
}

type UISubtaskTotal {
  type: String!
  quantity: Float!

}
type UITripTotal {
  type: String!
  quantity: Float!
}

type UISubtaskCounts {
  total: Float!
  afterHours: Float!
  afterHoursTaskIds: [Int]!

}
type UITripCounts {
  total: Float!
  afterHours: Float!
  afterHoursTaskIds: [Int]!
}

type UITypeTotals {
  subtaskPausal: Float!
  subtaskOverPausal: Float!
  subtaskProject: Float!

  tripPausal: Float!
  tripOverPausal: Float!
  tripProject: Float!
}
`
export const UserInvoiceQuerries = `
  getInvoiceUsers( fromDate: String!, toDate: String! ) :[InvoicedUser]
  getUserInvoice( fromDate: String!, toDate: String!, userId: Int! ): UserInvoice
`

export const UserInvoiceMutations = `
`
