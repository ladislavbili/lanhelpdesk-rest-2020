import defaultAttributes from './defaultAttributes';
export const EmailAttachment = `
type EmailAttachment {
  ${defaultAttributes}
  path: String!
  filename: String!
  mimetype: String!
  contentDisposition: String!
  size: Int!
  comment: Comment!
}
`

export const EmailAttachmentQuerries = `
`

export const EmailAttachmentMutations = `
`
