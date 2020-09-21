import defaultAttributes from './defaultAttributes';
export const Smtp = `
type Smtp {
  ${defaultAttributes}
  title: String!
  order: Int!
  def: Boolean!
  host: String!
  port: Int!
  username: String!
  password: String!
  rejectUnauthorized: Boolean!
  secure: Boolean!
  currentlyTested: Boolean!
  errorMessage: String
  working: Boolean!
}
`

export const SmtpQuerries = `
smtps: [Smtp]
smtp(id: Int!): Smtp
`

export const SmtpMutations = `
addSmtp( title: String!, order: Int!, def: Boolean!, host: String!, port: Int!, username: String!, password: String!, rejectUnauthorized: Boolean!, secure: Boolean! ): Smtp
updateSmtp( id: Int!, title: String, order: Int, def: Boolean, host: String, port: Int, username: String, password: String, rejectUnauthorized: Boolean, secure: Boolean ): Smtp
deleteSmtp( id: Int!, newDefId: Int, newId: Int ): Smtp
testSmtp( id: Int! ) : Boolean
testSmtps: Boolean
`
