import defaultAttributes from './defaultAttributes';

export const Repeat = `
type Repeat{
  ${defaultAttributes}
  repeatEvery: Int!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  tasks: [Task!]
  repeatTemplate: RepeatTemplate!
  active: Boolean!
  canEdit: Boolean!
  canCreateTask: Boolean
  repeatTimes: [RepeatTime]!
}

input TaskRepeatInput{
  repeatEvery: Int!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  active: Boolean!
}

enum EnumRepeatInterval{
  week
  day
  month
}
`

export const RepeatQuerries = `
repeats(
  projectId: Int,
  active: Boolean,
  from: String,
  to: String,
): [Repeat!]
calendarRepeats(
  projectId: Int,
  active: Boolean,
  from: String!,
  to: String!,
): [Repeat!]
repeat( id: Int ): Repeat
`

export const RepeatMutations = `
addRepeat(
  taskId: Int
  repeatEvery: Int!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  active: Boolean!
  repeatTemplate: RepeatTemplateAddInput!
): Repeat
updateRepeat(
  id: Int!
  repeatEvery: Int
  repeatInterval: EnumRepeatInterval
  startsAt: String
  active: Boolean
  repeatTemplate: RepeatTemplateUpdateInput
): Repeat
triggerRepeat(
  repeatId: Int!
  repeatTimeId: Int
  originalTrigger: String
): Task
deleteRepeat( id: Int! ): Repeat
`
