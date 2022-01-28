import defaultAttributes from './defaultAttributes';
export const CMDBScheme = `
type CMDBScheme {
  ${defaultAttributes}
  description: String!
  file: CMDBFile
  company: BasicCompany!
}

type CMDBFile {
  id: Int!
  filename: String!
  path: String!
  mimetype: String!
  encoding: String!
  size: Int!
}
`

export const CMDBSchemeQueries = `
cmdbScheme(companyId: Int!): CMDBScheme
`

export const CMDBSchemeMutations = `
addOrUpdateCmdbScheme(
  companyId: Int!
  description: String!
): CMDBScheme
`
