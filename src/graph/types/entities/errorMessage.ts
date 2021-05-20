import defaultAttributes from './defaultAttributes';

export const ErrorMessage = `
type ErrorMessage {
  ${defaultAttributes}
  errorMessage: String!
  read: Boolean!
  source: String!
  sourceId: Int
  type: String!
  user: User
}
`

export const ErrorMessageQuerries = `
  errorMessages: [ErrorMessage]
  errorMessageCount: Int
`

export const ErrorMessageMutations = `
  setErrorMessageRead( id: Int!, read: Boolean ): ErrorMessage
  setSelectedErrorMessagesRead( ids: [Int]!, read: Boolean ): [Int]
  setAllErrorMessagesRead( read: Boolean ): Boolean

  deleteErrorMessage( id: Int! ): ErrorMessage
  deleteSelectedErrorMessages( ids: [Int]! ): [Int]
  deleteAllErrorMessages: Boolean
`

export const ErrorMessageSubscriptions = `
  errorMessagesSubscription: Boolean
  errorMessageCountSubscription: Boolean
`
