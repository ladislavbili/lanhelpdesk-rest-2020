import defaultAttributes from './defaultAttributes';
export const TaskInvoice = `
type CompanyInvoiceInfo{
  company: Company!,
  subtasksHours: Float!,
  tripsHours: Float!,
  materialsQuantity: Float!,
  customItemsQuantity: Float!,
  rentedItemsQuantity: Float!
}

type InvoiceList{
  company: Company!,
  companyRentsCounts: InvoiceCompanyRentsCounts!
  pausalCounts: InvoicePausalCounts!
  overPausalCounts: InvoiceOverPausalCounts!
  projectTasks: [Task]!
  projectCounts: InvoiceProjectCounts!
  pausalTasks: [InvoiceTask]!
  overPausalTasks:[InvoiceTask]!
  materialTasks: [MaterialTask]!
  totalMaterialAndCustomItemPriceWithoutDPH: Float!
  totalMaterialAndCustomItemPriceWithDPH: Float!
}

type InvoiceCompanyRentsCounts{
  totalWithoutDPH: Float!
  totalWithDPH: Float!
}

type InvoicePausalCounts{
  subtasks: Float!
  subtasksAfterHours: Float!
  subtasksAfterHoursTaskIds: [Int]!
  subtasksAfterHoursPrice: Float!

  trips: Float!
  tripsAfterHours: Float!
  tripsAfterHoursTaskIds: [Int]!
  tripsAfterHoursPrice: Float!
}

type InvoiceOverPausalCounts{
  subtasks: Float!
  subtasksAfterHours: Float!
  subtasksAfterHoursTaskIds: [Int]!
  subtasksAfterHoursPrice: Float!
  subtasksTotalPriceWithoutDPH: Float!
  subtasksTotalPriceWithDPH: Float!

  trips: Float!
  tripsAfterHours: Float!
  tripsAfterHoursTaskIds: [Int]!,
  tripsAfterHoursPrice: Float!
  tripsTotalPriceWithoutDPH: Float!
  tripsTotalPriceWithDPH: Float!
}

type InvoiceProjectCounts{
  subtasks: Float!
  subtasksAfterHours: Float!
  subtasksAfterHoursTaskIds: [Int]!
  subtasksAfterHoursPrice: Float!
  subtasksTotalPriceWithoutDPH: Float!
  subtasksTotalPriceWithDPH: Float!

  trips: Float!
  tripsAfterHours: Float!
  tripsAfterHoursTaskIds: [Int]!,
  tripsAfterHoursPrice: Float!
  tripsTotalPriceWithoutDPH: Float!
  tripsTotalPriceWithDPH: Float!
}

type InvoiceTask {
  task: Task,
  subtasks: [InvoiceSubtask]!,
  trips: [InvoiceWorkTrip]!,
}

type InvoiceSubtask{
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  price: Float!
  type: TaskType!
  assignedTo: BasicUser!
}

type InvoiceWorkTrip{
  ${defaultAttributes}
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  type: TripType!
  price: Float!
  assignedTo: BasicUser!
}

type MaterialTask {
  task: Task!,
  materials: [InvoiceMaterial],
  customItems: [InvoiceCustomItem]
}

type InvoiceMaterial{
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  margin: Float!
  price: Float!,
  totalPrice: Float!
}

type InvoiceCustomItem{
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  price: Float!
  totalPrice: Float!
}

type TaskInvoice{
  title: String!
  tasks: [Task]!
}
`

export const TaskInvoiceQuerries = `
  getInvoiceCompanies( fromDate: String!, toDate: String!, statuses: [Int]! ) :[CompanyInvoiceInfo]
  getCompanyInvoiceData( fromDate: String!, toDate: String!, companyId: Int!, statuses: [Int]! ) :InvoiceList
  getCompanyInvoices( id:Int! ) :[TaskInvoice]
  getTaskInvoice( id:Int! ) :TaskInvoice
`

export const TaskInvoiceMutations = `
createTaskInvoice( fromDate: String!, toDate: String!, companyId: Int!, statuses: [Int]!, title: String! ) :TaskInvoice
`
