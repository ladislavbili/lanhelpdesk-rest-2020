import defaultAttributes from './defaultAttributes';
export const Subtask = `
type Subtask {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  task: Task!
  type: TaskType!
  assignedTo: BasicUser!
}
`

export const SubtaskQuerries = `
subtasks(taskId: Int!): [Subtask]
`

export const SubtaskMutations = `
addSubtask( title: String!, order: Int!, done: Boolean!, quantity: Float!, discount: Float!, task: Int!, type: Int!, assignedTo: Int! ): Subtask
updateSubtask( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, discount: Float, type: Int, assignedTo: Int ): Subtask
deleteSubtask( id: Int! ): Subtask
`
