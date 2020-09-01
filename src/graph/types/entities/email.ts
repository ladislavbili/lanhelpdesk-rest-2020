import defaultAttributes from './defaultAttributes';
export const Email = `
type Email {
  ${defaultAttributes}
  subject: String!
  message: String!

  user: BasicUser!
  task: Task
  toEmails: [String]!
}
`

export const EmailQuerries = `
emails(task: Int!): [Email]
`

export const EmailMutations = `
sendEmail( message: String!, message: String!, taskId: Int!, toEmails: [String]! ): Email
`
