import defaultAttributes from './defaultAttributes';

export const Repeat = `
type Repeat{
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  tasks: [Task!]
  repeatTemplate: RepeatTemplate!
}

input TaskRepeatInput{
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
}

enum EnumRepeatInterval{
  week
  day
  month
}
`

export const RepeatQuerries = `
repeats: [Repeat!]
repeat( id: Int! ): Repeat
`

export const RepeatMutations = `
addRepeat(
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
  repeatTemplate: RepeatTemplateAddInput!
): Repeat
updateRepeat(
  repeatEvery: String
  repeatInterval: EnumRepeatInterval
  startsAt: String
  repeatTemplate: RepeatTemplateUpdateInput
): Repeat
deleteRepeat( id: Int! ): Repeat
`
