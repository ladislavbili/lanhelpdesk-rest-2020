import defaultAttributes from './defaultAttributes';
export const Status = `
type Status {
  ${defaultAttributes}
  title: String!
  order: Int!
  color: String!
  icon: String!
  action: StatusAllowedType!
}

enum StatusAllowedType {
  None
  IsOpen
  IsNew
  CloseDate
  CloseInvalid
  PendingDate
  Invoiced
}

input NewStatusInput {
  id: Int!
  title: String!
  order: Int!
  color: String!
  icon: String!
  action: StatusAllowedType!
}

input UpdateStatusInput {
  id: Int!
  title: String
  order: Int
  color: String
  icon: String
  action: StatusAllowedType
}
`

export const StatusQuerries = `
statusTemplates: [Status]
statusTemplate(id: Int!): Status
statuses(projectId: Int!): [Status]
`

export const StatusMutations = `
addStatusTemplate( title: String!, order: Int!, color: String!, icon: String!, action: StatusAllowedType! ): Status
updateStatusTemplate( id: Int!, title: String, order: Int, color: String, icon: String, action: StatusAllowedType ): Status
deleteStatusTemplate( id: Int! ): Status
`
