import defaultAttributes from './defaultAttributes';
export const Imap = `
type Imap {
  ${defaultAttributes}
  title: String!
  order: Int!
  def: Boolean!
  host: String!
  port: Int!
  username: String!
  password: String!
  rejectUnauthorized: Boolean!
  tsl: Boolean!
  currentlyTested: Boolean!
  errorMessage: String!
  working: Boolean!
}
`

export const ImapQuerries = `
imaps: [Imap]
imap(id: Int!): Imap
`

export const ImapMutations = `
addImap( title: String!, order: Int!, def: Boolean!, host: String!, port: Int!, username: String!, password: String!, rejectUnauthorized: Boolean!, tsl: Boolean! ): Imap
updateImap( id: Int!, title: String, order: Int, def: Boolean, host: String, port: Int, username: String, password: String, rejectUnauthorized: Boolean, tsl: Boolean ): Imap
deleteImap( id: Int!, newDefId: Int, newId: Int ): Imap
`
