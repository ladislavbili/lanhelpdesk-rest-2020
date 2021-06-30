import defaultAttributes from './defaultAttributes';
export const CustomItem = `
type CustomItem {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean!
  approvedBy: User
  quantity: Float!
  price: Float!
  task: Task
  repeatTemplate: RepeatTemplate
  invoicedData: [InvoicedCustomItem]
}
`

export const CustomItemQueries = `
customItems(taskId: Int!): [CustomItem]
`

export const CustomItemMutations = `
addCustomItem( title: String!, order: Int!, done: Boolean!, quantity: Float!, price: Float!, task: Int!, approved: Boolean ): CustomItem
updateCustomItem( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, price: Float, approved: Boolean ): CustomItem
deleteCustomItem( id: Int! ): CustomItem

addRepeatTemplateCustomItem( title: String!, order: Int!, done: Boolean!, quantity: Float!, price: Float!, repeatTemplate: Int!, approved: Boolean ): CustomItem
updateRepeatTemplateCustomItem( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, price: Float, approved: Boolean ): CustomItem
deleteRepeatTemplateCustomItem( id: Int! ): CustomItem
`
