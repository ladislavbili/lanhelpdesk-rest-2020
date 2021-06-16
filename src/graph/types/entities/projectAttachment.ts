import defaultAttributes from './defaultAttributes';
export const ProjectAttachment = `
type ProjectAttachment {
  ${defaultAttributes}
  filename: String!
  path: String!
  mimetype: String!
  encoding: String!
  size: Int!
  project: Project!
}
`

export const ProjectAttachmentQuerries = `
`

export const ProjectAttachmentMutations = `
deleteProjectAttachment( id: Int! ): ProjectAttachment
`
