import defaultAttributes from './defaultAttributes';
export const TaskChange = `
type TaskChange {
  ${defaultAttributes}
  task: Task!
  user: BasicUser
  taskChangeMessages: [TaskChangeMessage]!
}

type TaskChangeMessage {
  ${defaultAttributes}
  type: String!
  originalValue: String
  newValue: String
  message: String!
}
`

export const TaskChangeQueries = `
  taskChanges(taskId: Int!, fromInvoice: Boolean): [TaskChange]
`

export const TaskChangeMutations = `
`

export const TaskChangeSubscriptions = `
  taskHistorySubscription(taskId: Int!): Boolean
`
