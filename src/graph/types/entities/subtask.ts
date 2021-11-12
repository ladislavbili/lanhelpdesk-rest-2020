import defaultAttributes from './defaultAttributes';
export const Subtask = `
type Subtask {
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
`

export const SubtaskQueries = `
subtasks(taskId: Int!, fromInvoice: Boolean): [Subtask]
`

export const SubtaskMutations = `
addSubtask( title: String!, order: Int, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput, fromInvoice: Boolean ): Subtask
updateSubtask( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput, fromInvoice: Boolean ): Subtask
deleteSubtask( id: Int!, fromInvoice: Boolean ): Subtask

addRepeatTemplateSubtask( title: String!, order: Int!, done: Boolean!, quantity: Float!, discount: Float!, repeatTemplate: Int!, type: Int!, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
updateRepeatTemplateSubtask( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
deleteRepeatTemplateSubtask( id: Int! ): Subtask
`
