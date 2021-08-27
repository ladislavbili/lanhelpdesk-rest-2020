import defaultAttributes from './defaultAttributes';
export const Company = `
type Company {
  ${defaultAttributes}
  title: String!
  def: Boolean!
  dph: Int!
  ico: String!
  dic: String!
  ic_dph: String!
  country: String!
  city: String!
  street: String!
  zip: String!
  email: String
  phone: String!
  description: String!

  monthly: Boolean!
  monthlyPausal: Float!
  taskWorkPausal: Float!
  taskTripPausal: Float!
  usedSubtaskPausal: Int!
  usedTripPausal: Int!

  pricelist: Pricelist!
  users: [BasicUser]
  companyRents: [CompanyRent]
  imaps: [Imap]!
}

type BasicCompany {
  id: Int!
  def: Boolean!
  title: String!
  dph: Int!
  monthly: Boolean!
  pricelist: Pricelist!
  users: [BasicUser]
  companyRents: [CompanyRent]

  usedSubtaskPausal: Int!
  usedTripPausal: Int!
}

type PausalCompany {
  ${defaultAttributes}
  title: String!
  monthly: Boolean!
  monthlyPausal: Float!
  taskWorkPausal: Float!
  taskTripPausal: Float!
  usedSubtaskPausal: Int!
  usedTripPausal: Int!

  pricelist: Pricelist!
  companyRents: [CompanyRent]
}

type CompanyDefaults {
  dph: Int!
}

type CompanyRent {
  ${defaultAttributes}
  title: String!
  quantity: Float!
  cost: Float!
  price: Float!
  total: Float!
}

input CompanyRentCreateInput{
  title: String!
  quantity: Float!
  cost: Float!
  price: Float!
}

input CompanyRentUpdateInput{
  id: Int
  title: String!
  quantity: Float!
  cost: Float!
  price: Float!
}

`

export const CompanyQueries = `
companies: [Company]
company(id: Int!): Company
companyDefaults: CompanyDefaults!
defCompany: Company
basicCompanies: [BasicCompany]
basicCompany(id: Int!): BasicCompany
pausalCompany(id: Int!): PausalCompany
`

export const CompanyMutations = `
addCompany( title: String!, dph: Int!, ico: String!, dic: String!, ic_dph: String!, country: String!, city: String!, street: String!, zip: String!, email: String, phone: String!, description: String!, pricelistId: Int!, monthly: Boolean!, monthlyPausal: Float!, taskWorkPausal: Float!, taskTripPausal: Float!, rents: [CompanyRentCreateInput]! ): Company
updateCompany( id: Int!, title: String, dph: Int, ico: String, dic: String, ic_dph: String, country: String, city: String, street: String, zip: String, email: String, phone: String, description: String, pricelistId: Int, monthly: Boolean, monthlyPausal: Float, taskWorkPausal: Float, taskTripPausal: Float, rents: [CompanyRentUpdateInput] ): Company
updateCompanyDefaults( dph: Int! ): CompanyDefaults!
deleteCompany( id: Int!, newId: Int! ): Company
`

export const CompanySubscriptions = `
  companiesSubscription: Boolean
`
