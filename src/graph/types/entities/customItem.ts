import defaultAttributes from './defaultAttributes';
export const CustomItem = `
type CustomItem {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  price: Float!
  task: Task!
}
`

export const CustomItemQuerries = `
customItems(taskId: Int!): [CustomItem]
`

export const CustomItemMutations = `
addCustomItem( title: String!, order: Int!, done: Boolean!, quantity: Float!, price: Float!, task: Int! ): CustomItem
updateCustomItem( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, price: Float ): CustomItem
deleteCustomItem( id: Int! ): CustomItem
`
