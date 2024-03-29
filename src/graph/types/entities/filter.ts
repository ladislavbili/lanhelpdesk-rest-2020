import defaultAttributes from './defaultAttributes';

export const Filter = `
type Filter {
  ${defaultAttributes}
  createdBy: User!
  title: String!
  description: String!
  pub: Boolean!
  active: Boolean!
  projectGroups: [ProjectGroup]
  global: Boolean!
  dashboard: Boolean!
  order: Int
  filter: filter!
  roles: [BasicRole]
  groups: [BasicProjectGroup]
  project: BasicProject
}

type BasicFilter{
  ${defaultAttributes}
  title: String!
  description: String!
  pub: Boolean!
  active: Boolean!
  projectGroups: [ProjectGroup]
  global: Boolean!
  dashboard: Boolean!
  order: Int
  filter: filter!
  project: BasicProject
  roles: [BasicRole]
  groups: [BasicProjectGroup]
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
  statuses: [Status]
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

  important: Boolean
  invoiced: Boolean
  pausal: Boolean
  overtime: Boolean
}

input ProjectFilterInput {
  id: Int
  title: String!
  description: String!
  filter: FilterInput!
  active: Boolean!
  order: Int
  groups: [Int]
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
  statuses: [Int]
  oneOf: [OneOfEnum]

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

  important: Boolean
  invoiced: Boolean
  pausal: Boolean
  overtime: Boolean
}
`

export const FilterQueries = `
myFilters: [BasicFilter]!
myFilter(id: Int!): Filter
publicFilters: [Filter]
filter(id: Int!): Filter
`

export const FilterMutations = `
addFilter(
  title: String!,
  pub: Boolean!,
  global: Boolean!,
  dashboard: Boolean!,
  filter: FilterInput!,
  order: Int,
  roles: [Int],
  projectId: Int
): Filter
updateFilter( id: Int!, title: String, pub: Boolean!, global: Boolean!, dashboard: Boolean!, filter: FilterInput, order: Int, roles: [Int], projectId: Int ): Filter
addPublicFilter( title: String!, global: Boolean!, dashboard: Boolean!, order: Int!, filter: FilterInput!, roles: [Int]!, projectId: Int ): Filter
updatePublicFilter( id: Int!, title: String, global: Boolean!, dashboard: Boolean!, order: Int, filter: FilterInput, roles: [Int], projectId: Int ): Filter
deleteFilter( id: Int! ): Filter
`

export const FilterSubscriptions = `
  filtersSubscription: Boolean
`
