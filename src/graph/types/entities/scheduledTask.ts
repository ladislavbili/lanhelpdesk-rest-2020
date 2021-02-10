import defaultAttributes from './defaultAttributes';
export const ScheduledTask = `
type ScheduledTask {
  ${defaultAttributes}
  from: String!
  to: String!
  user: User!
}

input ScheduledTaskInput {
  from: String!
  to: String!
  UserId: Int!
}
`

export const ScheduledTaskQuerries = `
`

export const ScheduledTaskMutations = `
addScheduledTask( from: String!, to: String!, UserId: Int!, task: Int! ): ScheduledTask
deleteScheduledTask( id: Int! ): ScheduledTask

addRepeatTemplateScheduledTask( from: String!, to: String!, UserId: Int!, repeatTemplate: Int! ): ScheduledTask
deleteRepeatTemplateScheduledTask( id: Int! ): ScheduledTask
`
