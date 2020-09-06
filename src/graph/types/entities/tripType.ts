import defaultAttributes from './defaultAttributes';
export const TripType = `
type TripType {
  ${defaultAttributes}
  title: String!
  order: Int!
  prices: [Price]
}
`

export const TripTypeQuerries = `
tripTypes: [TripType]
tripType(id: Int!): TripType
`

export const TripTypeMutations = `
addTripType( title: String!, order: Int ): TripType
updateTripType( id: Int!, title: String, order: Int ): TripType
deleteTripType( id: Int!, newId: Int! ): TripType
`
