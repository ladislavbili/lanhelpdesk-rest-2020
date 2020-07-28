import defaultAttributes from './defaultAttributes';
export const Pricelist = `
type Pricelist {
  ${defaultAttributes}
  title: String!
  order: Int!
  afterHours: Int!
  def: Boolean!
  materialMargin: Int!
  materialMarginExtra: Int!
  prices: [Price]!
  companies: [Company]!
}

enum PriceAllowedType {
  TripType
  TaskType
}

type Price {
  ${defaultAttributes}
  price: Float!
  type: PriceAllowedType!
  taskType: TaskType
  tripType: TripType
}

input CreatePriceInput {
  price: Float!
  type: PriceAllowedType!
  typeId: Int!
}

input UpdatePriceInput {
  id: Float!
  price: Int!
}
`

export const PricelistQuerries = `
pricelists: [Pricelist]
pricelist(id: Int!): Pricelist
`

export const PricelistMutations = `
addPricelist( title: String!, order: Int!, afterHours: Int!, def: Boolean!, materialMargin: Int!, materialMarginExtra: Int!, prices: [CreatePriceInput]! ): Pricelist
updatePricelist( id: Int!, title: String, order: Int, afterHours: Int, def: Boolean, materialMargin: Int, materialMarginExtra: Int, prices: [UpdatePriceInput] ): Pricelist
deletePricelist( id: Int!, newDefId: Int, newId: Int ): Pricelist
`
