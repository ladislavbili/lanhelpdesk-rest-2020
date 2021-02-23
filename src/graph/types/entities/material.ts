import defaultAttributes from './defaultAttributes';
export const Material = `
type Material {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean!
  approvedBy: User
  quantity: Float!
  margin: Float!
  price: Float!
  task: Task
  repeatTemplate: RepeatTemplate
  invoicedData: [InvoicedMaterial]
}
`

export const MaterialQuerries = `
materials(taskId: Int!): [Material]
`

export const MaterialMutations = `
addMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, task: Int!, approved: Boolean ): Material
updateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float, approved: Boolean ): Material
deleteMaterial( id: Int! ): Material

addRepeatTemplateMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, repeatTemplate: Int!, approved: Boolean ): Material
updateRepeatTemplateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float, approved: Boolean ): Material
deleteRepeatTemplateMaterial( id: Int! ): Material
`
