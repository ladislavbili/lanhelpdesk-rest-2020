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
  hour
  day
  week
  month
}
`

export const RepeatQueries = `
repeats(
  projectId: Int,
  milestoneId: Int,
  companyId: Int,
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

export const RepeatSubscriptions = `
  repeatsSubscription: Boolean
`
