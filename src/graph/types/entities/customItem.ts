import defaultAttributes from './defaultAttributes';
export const CustomItem = `
type CustomItem {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  price: Float!
  task: Task
  repeatTemplate: RepeatTemplate
  invoicedData: [InvoicedCustomItem]
}
`

export const CustomItemQuerries = `
customItems(taskId: Int!): [CustomItem]
`

export const CustomItemMutations = `
addCustomItem( title: String!, order: Int!, done: Boolean!, quantity: Float!, price: Float!, task: Int! ): CustomItem
updateCustomItem( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, price: Float ): CustomItem
deleteCustomItem( id: Int! ): CustomItem

addRepeatTemplateCustomItem( title: String!, order: Int!, done: Boolean!, quantity: Float!, price: Float!, repeatTemplate: Int! ): CustomItem
updateRepeatTemplateCustomItem( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, price: Float ): CustomItem
deleteRepeatTemplateCustomItem( id: Int! ): CustomItem
`
