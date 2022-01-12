import defaultAttributes from './defaultAttributes';
export const LanwikiTag = `
type LanwikiTag {
  ${defaultAttributes}
  title: String!
  color: String!
  order: Int!
  description: String!
}
`

export const LanwikiTagQueries = `
lanwikiTags: [LanwikiTag]
lanwikiTag(id: Int!): LanwikiTag
`

export const LanwikiTagMutations = `
addLanwikiTag( title: String!, color: String!, order: Int!, description: String! ): LanwikiTag
updateLanwikiTag( id: Int!, title: String!, color: String!, order: Int!, description: String! ): LanwikiTag
deleteLanwikiTag( id: Int! ): LanwikiTag
`

export const LanwikiTagSubscriptions = `
  lanwikiTagSubscription: Boolean
`
