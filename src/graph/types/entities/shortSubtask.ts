import defaultAttributes from './defaultAttributes';
export const ShortSubtask = `
type ShortSubtask {
  ${defaultAttributes}
  title: String!
  done: Boolean!
}

input ShortSubtaskInput{
  title: String
  done: Boolean
}
`

export const ShortSubtaskQueries = `
`

export const ShortSubtaskMutations = `
addShortSubtask( title: String!, done: Boolean, task: Int! ): Subtask
updateShortSubtask( id: Int!, title: String, done: Boolean ): Subtask
deleteShortSubtask( id: Int! ): Subtask

addRepeatTemplateShortSubtask( title: String!, done: Boolean, repeatTemplate: Int! ): Subtask
updateRepeatTemplateShortSubtask( id: Int!, title: String, done: Boolean ): Subtask
deleteRepeatTemplateShortSubtask( id: Int! ): Subtask
`
