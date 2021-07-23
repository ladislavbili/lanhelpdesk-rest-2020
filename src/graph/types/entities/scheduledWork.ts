import defaultAttributes from './defaultAttributes';
export const ScheduledWork = `
type ScheduledWork {
  ${defaultAttributes}
  from: String!
  to: String!
  subtask: Subtask
  workTrip: WorkTrip
  task: Task
  user: User
  canEdit: Boolean
}

input ScheduledWorkInput {
  from: String!
  to: String!
}
`

export const ScheduledWorkQueries = `
scheduledWorks(
  projectId: Int
  filter: FilterInput
  from: String
  to: String
  userId: Int
): [ScheduledWork]
`

export const ScheduledWorkMutations = `
  addScheduledWork( taskId: Int!, userId: Int!, from: String!, to: String! ): ScheduledWork
  updateScheduledWork( id: Int!, from: String!, to: String! ): ScheduledWork
  deleteScheduledWork( id: Int! ): ScheduledWork
`
