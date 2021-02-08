import defaultAttributes from './defaultAttributes';
export const RepeatTemplateAttachment = `
type RepeatTemplateAttachment {
  ${defaultAttributes}
  filename: String!
  path: String!
  mimetype: String!
  encoding: String!
  size: Int!
  repeatTemplate: RepeatTemplate!
}
`

export const RepeatTemplateAttachmentQuerries = `
`

export const RepeatTemplateAttachmentMutations = `
deleteRepeatTemplateAttachment( id: Int! ): RepeatTemplateAttachment
`
