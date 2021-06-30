import defaultAttributes from './defaultAttributes';
export const Tag = `
type Tag {
  ${defaultAttributes}
  title: String!
  color: String!
  order: Int!
  tasks: [Task]
  project: Project!
}

input NewTagInput {
  id: Int!
  title: String!
  color: String!
  order: Int!
}

input TagUpdateInput {
  id: Int!
  title: String
  color: String
  order: Int
}
`

export const TagQueries = `
`

export const TagMutations = `
`

export const TagSubscriptions = `
  tagsSubscription: Boolean
`
