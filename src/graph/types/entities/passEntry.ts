import defaultAttributes from './defaultAttributes';
export const PassEntry = `
type PassEntry {
  ${defaultAttributes}
  title: String!
  login: String!
  password: String!
  url: String!
  expireDate: String
  note: String!
  createdBy: BasicUser
  updatedBy: BasicUser
}

enum EnumPassEntrySort {
  id
  title
  updatedAt
}

input PassEntryStringFilterInput {
  title: String
}

type PassEntries {
  passwords: [PassEntry]!
  count: Int!
}
`

export const PassEntryQueries = `
passEntries(folderId: Int, order: EnumPassEntrySort!, limit: Int, page: Int, stringFilter: PassEntryStringFilterInput): PassEntries
passEntry(id: Int!): PassEntry
`

export const PassEntryMutations = `
addPassEntry(
  folderId: Int
  title: String!
  login: String!
  password: String!
  url: String
  expireDate: String
  note: String
): PassEntry
updatePassEntry(
  id: Int!
  title: String
  login: String
  password: String
  url: String
  expireDate: String
  note: String
): PassEntry
deletePassEntry( id: Int! ): PassEntry
`

export const PassEntrySubscriptions = `
  passEntriesSubscription(folderId: Int): Int
`
