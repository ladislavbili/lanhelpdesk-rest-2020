import defaultAttributes from './defaultAttributes';
export const TaskChange = `
type TaskChange {
  ${defaultAttributes}
  task: Task!
  user: BasicUser!
  taskChangeMessages: [TaskChangeMessage]!
}

type TaskChangeMessage {
  type: String!
  originalValue: String
  newValue: String
  message: String!
}
`

export const TaskChangeQuerries = `
`

export const TaskChangeMutations = `
`
