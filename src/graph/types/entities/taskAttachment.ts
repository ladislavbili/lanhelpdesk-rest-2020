import defaultAttributes from './defaultAttributes';
export const TaskAttachment = `
type TaskAttachment {
  ${defaultAttributes}
  filename: String!
  path: String!
  mimetype: String!
  encoding: String!
  size: Int!
  task: Task!
}
`

export const TaskAttachmentQueries = `
`

export const TaskAttachmentMutations = `
deleteTaskAttachment( id: Int! ): TaskAttachment
`
