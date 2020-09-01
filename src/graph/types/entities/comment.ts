import defaultAttributes from './defaultAttributes';
export const Comment = `
type Comment {
  ${defaultAttributes}
  message: String!
  internal: Boolean!
  user: BasicUser!
  task: Task!
  childComments: [Comment]!
  parentComment: Comment
  parentCommentId: Int
}
`

export const CommentQuerries = `
comments( task: Int! ): [Comment]
`

export const CommentMutations = `
addComment( message: String!, internal: Boolean!, task: Int!, parentCommentId: Int ): Comment
`
