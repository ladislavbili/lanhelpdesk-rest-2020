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
`

export const StatusQuerries = `
statuses: [Status]
status(id: Int!): Status
`

export const StatusMutations = `
addStatus( title: String!, order: Int!, color: String!, icon: String!, action: StatusAllowedType! ): Status
updateStatus( id: Int!, title: String, order: Int, color: String, icon: String, action: StatusAllowedType ): Status
deleteStatus( id: Int!, newId: Int! ): Status
`
