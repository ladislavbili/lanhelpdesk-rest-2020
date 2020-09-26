import defaultAttributes from './defaultAttributes';
export const Imap = `
type Imap {
  ${defaultAttributes}
  active: Boolean!
  title: String!
  order: Int!
  def: Boolean!
  host: String!
  port: Int!
  username: String!
  password: String!
  rejectUnauthorized: Boolean!
  tls: Boolean!
  destination: String!
  ignoredRecievers: String!
  ignoredRecieversDestination: String!
  currentlyTested: Boolean!
  errorMessage: String
  working: Boolean!

  project: Project!
  role: Role!
  company: Company!
}
`

export const ImapQuerries = `
imaps: [Imap]
imap(id: Int!): Imap
`

export const ImapMutations = `
addImap( active: Boolean!, title: String!, order: Int!, def: Boolean!, host: String!, port: Int!, username: String!, password: String!, rejectUnauthorized: Boolean!, tls: Boolean!, destination: String!, ignoredRecievers: String!, ignoredRecieversDestination: String, projectId: Int!, roleId: Int!, companyId: Int! ): Imap
updateImap( active: Boolean, id: Int!, title: String, order: Int, def: Boolean, host: String, port: Int, username: String, password: String, rejectUnauthorized: Boolean, tls: Boolean, destination: String, ignoredRecievers: String, ignoredRecieversDestination: String, projectId: Int, roleId: Int, companyId: Int ): Imap
deleteImap( id: Int!, newDefId: Int, newId: Int ): Imap
testImap( id: Int! ) : Boolean
testImaps: Boolean
`
