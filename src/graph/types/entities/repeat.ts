import defaultAttributes from './defaultAttributes';

export const Repeat = `
type Repeat{
  ${defaultAttributes}
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  tasks: [Task!]
  repeatTemplate: RepeatTemplate!
  active: Boolean!
}

input TaskRepeatInput{
  repeatEvery: String!
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
repeats( projectId: Int ): [Repeat!]
repeat( id: Int ): Repeat
`

export const RepeatMutations = `
addRepeat(
  taskId: Int
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  active: Boolean!
  repeatTemplate: RepeatTemplateAddInput!
): Repeat
updateRepeat(
  id: Int!
  repeatEvery: String
  repeatInterval: EnumRepeatInterval
  startsAt: String
  active: Boolean
  repeatTemplate: RepeatTemplateUpdateInput
): Repeat
deleteRepeat( id: Int! ): Repeat
`
