import defaultAttributes from './defaultAttributes';
export const TaskType = `
type TaskType {
  ${defaultAttributes}
  title: String!
  order: Int!
  prices: [Price]
}
`

export const TaskTypeQueries = `
taskTypes: [TaskType]
taskType(id: Int!): TaskType
`

export const TaskTypeMutations = `
addTaskType( title: String!, order: Int ): TaskType
updateTaskType( id: Int!, title: String, order: Int ): TaskType
deleteTaskType( id: Int!, newId: Int! ): TaskType
`

export const TaskTypeSubscriptions = `
  taskTypesSubscription: Boolean
`
