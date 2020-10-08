import defaultAttributes from './defaultAttributes';
export const Comment = `
type Comment {
  ${defaultAttributes}
  message: String!
  rawMessage: String
  html: String
  rawHtml: String
  isEmail: Boolean!
  internal: Boolean!
  user: BasicUser!
  task: Task!
  childComments: [Comment]!
  parentComment: Comment
  parentCommentId: Int
  subject: String
  tos: [String]
  commentAttachments: [CommentAttachment]
  emailError: String
  emailSend: Boolean
}
`

export const CommentQuerries = `
comments( task: Int! ): [Comment]
`

export const CommentMutations = `
addComment( message: String!, internal: Boolean!, task: Int!, parentCommentId: Int ): Comment
sendEmail( message: String!, task: Int!, parentCommentId: Int, tos: [String]!, subject: String! ): Comment
resendEmail( messageId: Int! ): Comment
`
