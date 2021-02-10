import defaultAttributes from './defaultAttributes';
export const Material = `
type Material {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
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
addMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, task: Int! ): Material
updateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float ): Material
deleteMaterial( id: Int! ): Material

addRepeatTemplateMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, repeatTemplate: Int! ): Material
updateRepeatTemplateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float ): Material
deleteRepeatTemplateMaterial( id: Int! ): Material
`
