import defaultAttributes from './defaultAttributes';
export const CMDBCategory = `
type CMDBCategory {
  ${defaultAttributes}
  title: String!
  descriptionLabel: String!
  backupLabel: String!
  monitoringLabel: String!
}
`

export const CMDBCategoryQueries = `
cmdbCategories: [CMDBCategory]
cmdbCategory(id: Int!): CMDBCategory
`

export const CMDBCategoryMutations = `
addCmdbCategory(
  title: String!
  descriptionLabel: String!
  backupLabel: String!
  monitoringLabel: String!
): CMDBCategory

updateCmdbCategory(
  id: Int!
  title: String!
  descriptionLabel: String!
  backupLabel: String!
  monitoringLabel: String!
): CMDBCategory

deleteCmdbCategory(
  id: Int!
  newId: Int
): CMDBCategory
`

export const CMDBCategorySubscriptions = `
  cmdbCategoriesSubscription: Boolean
`
