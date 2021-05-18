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
  assignedTos: [BasicUser]
  requesterCur: Boolean!
  requesters: [BasicUser]
  companyCur: Boolean!
  companies: [BasicCompany]
  taskTypes: [TaskType]
  tags: [Tag]
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
  scheduledFrom: String
  scheduledFromNow: Boolean!
  scheduledTo: String
  scheduledToNow: Boolean!
  createdAtFrom: String
  createdAtFromNow: Boolean!
  createdAtTo: String
  createdAtToNow: Boolean!

  important: BooleanSelectEnum
  invoiced: BooleanSelectEnum
  pausal: BooleanSelectEnum
  overtime: BooleanSelectEnum
}

enum BooleanSelectEnum {
  yes
  no
}

input FilterInput {
  assignedToCur: Boolean!
  assignedTos: [Int]
  requesterCur: Boolean!
  requesters: [Int]
  companyCur: Boolean!
  companies: [Int]
  taskTypes: [Int]
  tags: [Int]
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
  scheduledFrom: String
  scheduledFromNow: Boolean!
  scheduledTo: String
  scheduledToNow: Boolean!
  createdAtFrom: String
  createdAtFromNow: Boolean!
  createdAtTo: String
  createdAtToNow: Boolean!

  important: BooleanSelectEnum
  invoiced: BooleanSelectEnum
  pausal: BooleanSelectEnum
  overtime: BooleanSelectEnum
}
`

export const FilterQuerries = `
myFilters: [BasicFilter]!
myFilter(id: Int!): Filter
publicFilters: [Filter]
filter(id: Int!): Filter
`

export const FilterMutations = `
addFilter( title: String!, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput!, order: Int, roles: [Int], projectId: Int ): Filter
updateFilter( id: Int!, title: String, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput, order: Int, roles: [Int], projectId: Int ): Filter
addPublicFilter( title: String!, global: Boolean!, dashboard: Boolean!, order: Int!, filter: FilterInput!, roles: [Int]!, projectId: Int ): Filter
updatePublicFilter( id: Int!, title: String, global: Boolean!, dashboard: Boolean!, order: Int, filter: FilterInput, roles: [Int], projectId: Int ): Filter
deleteFilter( id: Int! ): Filter
`

export const FilterSubscriptions = `
  filtersSubscription: Boolean
`
