import defaultAttributes from './defaultAttributes';
export const TaskAttachment = `
type TaskAttachment {
  ${defaultAttributes}
  filename: String!
  mimetype: String!
  encoding: String!
  task: Task!
}
`

export const TaskAttachmentQuerries = `
`

export const TaskAttachmentMutations = `
  uploadTaskAttachments( taskId: Int!, files: [Upload!]! ): TaskAttachment
`
