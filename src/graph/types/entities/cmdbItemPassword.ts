import defaultAttributes from './defaultAttributes';
export const CMDBItemPassword = `
type CMDBItemPassword {
  ${defaultAttributes}
  title: String!
  login: String!
  password: String!
  url: String!
  expireDate: String
  note: String!
}

input CMDBItemPasswordInput {
  title: String!
  login: String!
  password: String!
  url: String!
  expireDate: String
  note: String!
}
`

export const CMDBItemPasswordQueries = `
`

export const CMDBItemPasswordMutations = `
addCmdbItemPassword(
  itemId: Int
  title: String!
  login: String!
  password: String!
  url: String
  expireDate: String
  note: String
): CMDBItemPassword
updateCmdbItemPassword(
  id: Int!
  title: String
  login: String
  password: String
  url: String
  expireDate: String
  note: String
): CMDBItemPassword
deleteCmdbItemPassword( id: Int! ): CMDBItemPassword
`
