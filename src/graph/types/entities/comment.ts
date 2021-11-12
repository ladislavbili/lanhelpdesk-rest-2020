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
  user: BasicUser
  task: Task!
  childComments: [Comment]!
  parentComment: Comment
  parentCommentId: Int
  subject: String
  tos: [String]
  commentAttachments: [CommentAttachment]
  emailError: String
  emailSend: Boolean
  messageCount: Int
}
`

export const CommentQueries = `
comments( task: Int!, limit: Int, page: Int, fromInvoice: Boolean ): [Comment]
`

export const CommentMutations = `
resendEmail( messageId: Int! ): Comment
`


export const CommentSubscriptions = `
  commentsSubscription( taskId: Int! ): Int
`
