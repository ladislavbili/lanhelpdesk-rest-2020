import defaultAttributes from './defaultAttributes';
export const CommentAttachment = `
type CommentAttachment {
  ${defaultAttributes}
  path: String!
  filename: String!
  mimetype: String!
  contentDisposition: String!
  size: Int!
  comment: Comment!
}
`

export const CommentAttachmentQuerries = `
`

export const CommentAttachmentMutations = `
`
