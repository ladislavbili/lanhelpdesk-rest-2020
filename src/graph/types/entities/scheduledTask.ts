import defaultAttributes from './defaultAttributes';
export const ScheduledTask = `
type ScheduledTask {
  ${defaultAttributes}
  from: String!
  to: String!
  user: User!
  task: Task!
  canEdit: Boolean
  canView: Boolean
}

input ScheduledTaskInput {
  from: String!
  to: String!
  UserId: Int!
}
`

export const ScheduledTaskQuerries = `
scheduledTasks(
  projectId: Int
  filter: FilterInput
  from: String
  to: String
  userId: Int
): [ScheduledTask]
`

export const ScheduledTaskMutations = `
addScheduledTask( from: String!, to: String!, UserId: Int!, task: Int! ): ScheduledTask
updateScheduledTask( id: Int!, from: String!, to: String! ): ScheduledTask
deleteScheduledTask( id: Int! ): ScheduledTask
`
