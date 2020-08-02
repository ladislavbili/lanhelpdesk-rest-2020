import defaultAttributes from './defaultAttributes';

export const ErrorMessage = `
type ErrorMessage {
  ${defaultAttributes}
  errorMessage: String!
  read: Boolean!
  source: String!
  sourceId: Int!
  type: String!
  user: User
}
`

export const ErrorMessageQuerries = `
errorMessages: [ErrorMessage]
`

export const ErrorMessageMutations = `
setErrorMessageRead( id: Int!, read: Boolean ): ErrorMessage
setSelectedErrorMessagesRead( ids: [Int]!, read: Boolean ): [ErrorMessage]
setAllErrorMessagesRead( read: Boolean ): [ErrorMessage]

deleteErrorMessage( id: Int! ): ErrorMessage
deleteSelectedErrorMessages( ids: [Int]! ): [ErrorMessage]
deleteAllErrorMessages: [ErrorMessage]
`
