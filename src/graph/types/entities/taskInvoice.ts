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
  company: Company!
  companyRentsCounts: InvoiceCompanyRentsCounts!
  pausalCounts: InvoicePausalCounts!
  overPausalCounts: InvoiceOverPausalCounts!
  projectTasks: [InvoiceTask]!
  projectCounts: InvoiceProjectCounts!
  pausalTasks: [InvoiceTask]!
  overPausalTasks:[InvoiceTask]!
  materialTasks: [InvoiceMaterialTask]!
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
  subtaskID: Int
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
  workTripID: Int
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  type: TripType!
  price: Float!
  assignedTo: BasicUser!
}

type InvoiceMaterialTask {
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

type TaskInvoice {
  ${defaultAttributes}
  title: String!
  fromDate: String!
  toDate: String!
  companyRentsCounts: InvoiceCompanyRentsCounts!
  pausalCounts: InvoicePausalCounts!
  overPausalCounts: InvoiceOverPausalCounts!
  projectCounts: InvoiceProjectCounts!
  totalMaterialAndCustomItemPriceWithoutDPH: Float!
  totalMaterialAndCustomItemPriceWithDPH: Float!
  company: Company!
  invoicedCompany: InvoicedCompany!

  materialTasks: [MaterialTask]!
  pausalTasks: [InvoicedTask]!
  overPausalTasks: [InvoicedTask]!
  projectTasks: [InvoicedTask]!
}

type InvoicedCompany {
  ${defaultAttributes}
  title: String!
  dph: Float!
  monthly: Boolean!
  monthlyPausal: Float
  taskTripPausal: Float
  taskWorkPausal: Float
  companyRents: [InvoicedCompanyRent]!
}

type InvoicedCompanyRent {
  ${defaultAttributes}
  title: String!
  quantity: Float!
  cost: Float!
  price: Float!
  total: Float!
}

type MaterialTask {
  ${defaultAttributes}
  task: Task!
  materials: [InvoicedMaterial]!
  customItems: [InvoicedCustomItem]!
}

type InvoicedMaterial {
  ${defaultAttributes}
  material: Material!
  title: String!
  quantity: Float!
  price: Float!
  totalPrice: Float!
  margin: Float!
}

type InvoicedCustomItem {
  ${defaultAttributes}
  customItem: CustomItem!
  title: String!
  quantity: Float!
  price: Float!
  totalPrice: Float!
}

type InvoicedTask {
  ${defaultAttributes}
  task: Task!
  subtasks: [InvoicedSubtask]!
  trips: [InvoicedTrip]!
}

type InvoicedSubtask {
  ${defaultAttributes}
  subtask: Subtask!
  price: Float!
  quantity: Float!
  type: String!
  assignedTo: String!
}

type InvoicedTrip {
  ${defaultAttributes}
  trip: WorkTrip!
  price: Float!
  quantity: Float!
  type: String!
  assignedTo: String!
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
