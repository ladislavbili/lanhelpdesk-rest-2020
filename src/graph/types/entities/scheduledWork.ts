import defaultAttributes from './defaultAttributes';
export const ScheduledWork = `
type ScheduledWork {
  ${defaultAttributes}
  from: String!
  to: String!
  subtask: Subtask
  workTrip: WorkTrip
}

input ScheduledWorkInput {
  from: String!
  to: String!
}
`

export const ScheduledWorkQuerries = `
`

export const ScheduledWorkMutations = `
`
