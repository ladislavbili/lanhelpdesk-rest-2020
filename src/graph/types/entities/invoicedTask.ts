import defaultAttributes from './defaultAttributes';
export const InvoicedTask = `
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
    assignedTo: [InvoicedAssignedTo]!
    tags: [InvoicedTag]!
    project: String!
    requester: String!
    taskType: String!
    company: String!
    milestone: String
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

  type InvoicedAssignedTo {
    ${defaultAttributes}
    title: String!
    color: String!
    UserId: Int
  }

  type InvoicedTag {
    ${defaultAttributes}
    title: String!
    color: String!
    TagId: Int
  }

  input TaskChangeInput {
    title: String
    important: Boolean
    closeDate: String
    assignedTo: [Int]
    company: Int
    deadline: String
    description: String
    milestone: Int
    overtime: Boolean
    pausal: Boolean
    pendingChangable: Boolean
    pendingDate: String
    project: Int
    requester: Int
    status: Int
    tags: [Int]
    taskType: Int
  }

  input SMTCChangesInput {
    subtasks: SubtaskChangesInput
    trips: TripChangesInput
    materials: MaterialChangesInput
    customItems: CustomItemChangesInput
  }

  input SubtaskChangesInput {
    ADD: [AddSubtaskChangesInput]
    EDIT: [EditSubtaskChangesInput]
    DELETE: [Int]

  }
  input TripChangesInput {
    ADD: [AddTripChangesInput]
    EDIT: [EditTripChangesInput]
    DELETE: [Int]

  }
  input MaterialChangesInput {
    ADD: [AddMaterialChangesInput]
    EDIT: [EditMaterialChangesInput]
    DELETE: [Int]

  }
  input CustomItemChangesInput {
    ADD: [AddCustomItemChangesInput]
    EDIT: [EditCustomItemChangesInput]
    DELETE: [Int]
  }
  input AddSubtaskChangesInput {
    assignedTo: Int
    discount: Float
    order: Int
    quantity: Float
    title: String
    type: Int
  }

  input EditSubtaskChangesInput {
    assignedTo: Int
    discount: Float
    id: Int
    order: Int
    quantity: Float
    title: String
    type: Int
  }

  input AddTripChangesInput {
    assignedTo: Int
    discount: Float
    order: Int
    quantity: Float
    type: Int
  }

  input EditTripChangesInput {
    assignedTo: Int
    discount: Float
    id: Int
    order: Int
    quantity: Float
    type: Int
  }

  input AddMaterialChangesInput {
    margin: Float
    order: Int
    price: Float
    quantity: Float
    title: String
  }

  input EditMaterialChangesInput {
    id: Int
    margin: Float
    order: Int
    price: Float
    quantity: Float
    title: String
  }

  input AddCustomItemChangesInput {
    price: Float
    order: Int
    quantity: Float
    title: String
  }

  input EditCustomItemChangesInput {
    id: Int
    price: Float
    order: Int
    quantity: Float
    title: String
  }
`


export const InvoicedTaskQuerries = `

`

export const InvoicedTaskMutations = `
  updateInvoicedTask( id: Int!, taskChanges: TaskChangeInput, stmcChanges: SMTCChangesInput ): Task

`
