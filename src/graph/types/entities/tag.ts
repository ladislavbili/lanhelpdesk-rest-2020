import defaultAttributes from './defaultAttributes';
export const Tag = `
type Tag {
  ${defaultAttributes}
  title: String!
  color: String!
  order: Int!
  tasks: [Task]
}
`

export const TagQuerries = `
tags: [Tag]
tag(id: Int!): Tag
`

export const TagMutations = `
addTag( title: String!, color: String, order: Int ): Tag
updateTag( id: Int!, title: String, color: String, order: Int ): Tag
deleteTag( id: Int! ): Tag
`
