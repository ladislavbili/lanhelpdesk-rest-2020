import defaultAttributes from './defaultAttributes';
export const InvoiceTask = `
  type InvoiceTask {
      ${defaultAttributes}
      taskId: Int
      title: String!
      important: Boolean!
      closeDate: String
      assignedTo: [BasicUser]!
      company: Company
      createdBy: BasicUser
      startsAt: String
      deadline: String
      invoicedDate: String
      description: String!
      milestone: Milestone
      overtime: Boolean!
      pausal: Boolean!
      pendingChangable: Boolean!
      pendingDate: String
      project: Project
      requester: BasicUser
      status: Status
      statusChange: String!
      tags: [Tag]!
      taskType: TaskType
      invoiced: Boolean!
      ganttOrder: Int

      attributeRights: ProjectGroupAttributeRights
      rights: ProjectGroupRights
      repeat: Repeat
      metadata: TaskMetadata!
      comments: [Comment]!
      shortSubtasks: [ShortSubtask]!
      subtasks: [InvoiceSubtask]!
      workTrips: [InvoiceWorkTrip]!
      materials: [InvoiceMaterial]!
      taskChanges: [TaskChange]!
      taskAttachments: [TaskAttachment]!
      repeatTime: RepeatTime

      subtasksQuantity: Float
      approvedSubtasksQuantity: Float
      pendingSubtasksQuantity: Float
      workTripsQuantity: Float
      materialsPrice: Float
      approvedMaterialsPrice: Float
      pendingMaterialsPrice: Float
  }
  type InvoiceSubtask {
    ${defaultAttributes}
    title: String!
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
    type: TaskType
    assignedTo: BasicUser!
    scheduled: ScheduledWork
  }
  type InvoiceWorkTrip {
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
  type InvoiceMaterial {
    ${defaultAttributes}
    title: String!
    order: Int!
    done: Boolean!
    approved: Boolean!
    quantity: Float!
    margin: Float!
    price: Float!
    total: Float

    approvedBy: User
    task: Task
    repeatTemplate: RepeatTemplate
  }

`

export const InvoiceTaskQueries = `
`

export const InvoiceTaskMutations = `
`
