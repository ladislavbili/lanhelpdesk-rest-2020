import defaultAttributes from './defaultAttributes';
export const Subtask = `
type Subtask {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean!
  approvedBy: User
  quantity: Float!
  discount: Float!
  task: Task
  repeatTemplate: RepeatTemplate
  type: TaskType
  assignedTo: BasicUser!
  scheduled: ScheduledWork
}
`

export const SubtaskQueries = `
subtasks(taskId: Int!): [Subtask]
`

export const SubtaskMutations = `
addSubtask( title: String!, order: Int, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
updateSubtask( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
deleteSubtask( id: Int! ): Subtask

addRepeatTemplateSubtask( title: String!, order: Int!, done: Boolean!, quantity: Float!, discount: Float!, repeatTemplate: Int!, type: Int!, assignedTo: Int!, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
updateRepeatTemplateSubtask( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int, approved: Boolean, scheduled: ScheduledWorkInput ): Subtask
deleteRepeatTemplateSubtask( id: Int! ): Subtask
`
