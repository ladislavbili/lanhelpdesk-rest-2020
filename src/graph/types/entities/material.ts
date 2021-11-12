import defaultAttributes from './defaultAttributes';
export const Material = `
type Material {
  ${defaultAttributes}
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean!
  quantity: Float!
  margin: Float!
  price: Float!
  total: Float

  approvedBy: User
  task: Task
  repeatTemplate: RepeatTemplate
}
`

export const MaterialQueries = `
materials( taskId: Int!, fromInvoice: Boolean ): [Material]
`

export const MaterialMutations = `
addMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, task: Int!, approved: Boolean, fromInvoice: Boolean ): Material
updateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float, approved: Boolean, fromInvoice: Boolean ): Material
deleteMaterial( id: Int!, fromInvoice: Boolean ): Material

addRepeatTemplateMaterial( title: String!, order: Int!, done: Boolean!, quantity: Float!, margin: Float!, price: Float!, repeatTemplate: Int!, approved: Boolean ): Material
updateRepeatTemplateMaterial( id: Int!, title: String, order: Int, done: Boolean, quantity: Float, margin: Float, price: Float, approved: Boolean ): Material
deleteRepeatTemplateMaterial( id: Int! ): Material
`
