import defaultAttributes from './defaultAttributes';

export const Filter = `
type Filter {
  ${defaultAttributes}
  createdBy: User!
  title: String!
  pub: Boolean!
  global: Boolean!
  dashboard: Boolean!
  order: Int
  filter: filter!
  roles: [BasicRole]
  project: BasicProject
}

type BasicFilter{
  ${defaultAttributes}
  title: String!
  pub: Boolean!
  global: Boolean!
  dashboard: Boolean!
  order: Int
  filter: filter!
  project: BasicProject
  roles: [BasicRole]
}

enum OneOfEnum {
  requester
  assigned
  company
}

type filter {
  assignedToCur: Boolean!
  assignedTo: BasicUser
  requesterCur: Boolean!
  requester: BasicUser
  companyCur: Boolean!
  company: BasicCompany
  taskType: TaskType
  oneOf: [OneOfEnum]!

  statusDateFrom: String
  statusDateFromNow: Boolean!
  statusDateTo: String
  statusDateToNow: Boolean!
  pendingDateFrom: String
  pendingDateFromNow: Boolean!
  pendingDateTo: String
  pendingDateToNow: Boolean!
  closeDateFrom: String
  closeDateFromNow: Boolean!
  closeDateTo: String
  closeDateToNow: Boolean!
  deadlineFrom: String
  deadlineFromNow: Boolean!
  deadlineTo: String
  deadlineToNow: Boolean!
}

input FilterInput {
  assignedToCur: Boolean!
  assignedTo: Int
  requesterCur: Boolean!
  requester: Int
  companyCur: Boolean!
  company: Int
  taskType: Int
  oneOf: [OneOfEnum]!

  statusDateFrom: String
  statusDateFromNow: Boolean!
  statusDateTo: String
  statusDateToNow: Boolean!
  pendingDateFrom: String
  pendingDateFromNow: Boolean!
  pendingDateTo: String
  pendingDateToNow: Boolean!
  closeDateFrom: String
  closeDateFromNow: Boolean!
  closeDateTo: String
  closeDateToNow: Boolean!
  deadlineFrom: String
  deadlineFromNow: Boolean!
  deadlineTo: String
  deadlineToNow: Boolean!
}
`

export const FilterQuerries = `
myFilters: [BasicFilter]!
publicFilters: [Filter]
filter(id: Int!): Filter
`

export const FilterMutations = `
addFilter( title: String!, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput!, order: Int, roles: [Int], projectId: Int ): Filter
updateFilter( id: Int!, title: String, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput, order: Int, roles: [Int], projectId: Int ): Filter
addPublicFilter( title: String!, global: Boolean!, dashboard: Boolean!, order: Int!, filter: FilterInput!, order: Int!, roles: [Int]!, projectId: Int ): Filter
updatePublicFilter( id: Int!, title: String, global: Boolean!, dashboard: Boolean!, order: Int, filter: FilterInput, order: Int, roles: [Int], projectId: Int ): Filter
deleteFilter( id: Int! ): Filter
`