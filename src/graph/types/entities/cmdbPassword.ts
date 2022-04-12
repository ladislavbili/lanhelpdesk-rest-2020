import defaultAttributes from './defaultAttributes';
export const CMDBPassword = `
type CMDBPassword {
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

enum EnumCMDBPasswordSort {
  id
  title
  updatedAt
}

input CMDBPasswordStringFilterInput {
  title: String
}

type CMDBPasswords {
  passwords: [CMDBPassword]!
  count: Int!
}
`

export const CMDBPasswordQueries = `
cmdbPasswords(companyId: Int, order: EnumCMDBPasswordSort!, limit: Int, page: Int, stringFilter: CMDBPasswordStringFilterInput): CMDBPasswords
cmdbPassword(id: Int!): CMDBPassword
`

export const CMDBPasswordMutations = `
addCmdbPassword(
  companyId: Int
  title: String!
  login: String!
  password: String!
  url: String
  expireDate: String
  note: String
): CMDBPassword
updateCmdbPassword(
  id: Int!
  title: String
  login: String
  password: String
  url: String
  expireDate: String
  note: String
): CMDBPassword
deleteCmdbPassword( id: Int! ): CMDBPassword
`

export const CMDBPasswordSubscriptions = `
  cmdbPasswordsSubscription(companyId: Int): Int
`
