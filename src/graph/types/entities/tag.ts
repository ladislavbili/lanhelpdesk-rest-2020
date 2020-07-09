import defaultAttributes from './defaultAttributes';
// @AuthDirective @AccessDirective( access:["tags"] )
export const Tag = `
type Tag {
  ${defaultAttributes}
  title: String,
  color: String!,
  order: Int!,
  tasks: [Task],
}
`

export const TagQuerries = `
tags(filter: String): [Tag],
tag(id: Int!): Tag,
`

export const TagMutations = `
addTag( title: String!, color: String, order: Int ): Tag,
updateTag( id: Int!, title: String, color: String, order: Int ): Tag,
deleteTag( id: Int! ): Tag,
`
