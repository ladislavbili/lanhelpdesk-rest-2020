import defaultAttributes from './defaultAttributes';

export const RepeatTime = `
type RepeatTime{
  ${defaultAttributes}
  originalTrigger: String!
  triggersAt: String!
  repeat: Repeat!
  triggered: Boolean!
  canEdit: Boolean
  canCreateTask: Boolean
  task: Task
}
`

export const RepeatTimeQuerries = `
repeatTimes(
  active: Boolean
  repeatId: Int,
  repeatIds: [Int],
  from: String,
  to: String,
): [RepeatTime!]
`

export const RepeatTimeMutations = `
addRepeatTime(
  repeatId: Int!
  originalTrigger: String!
  triggersAt: String!
  triggered: Boolean
): RepeatTime
updateRepeatTime(
  id: Int
  triggersAt: String
  triggered: Boolean
): RepeatTime
deleteRepeatTime( id: Int! ): RepeatTime
`
