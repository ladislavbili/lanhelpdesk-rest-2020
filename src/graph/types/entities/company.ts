import defaultAttributes from './defaultAttributes';
export const Company = `
type Company {
  ${defaultAttributes}
  title: String!
  dph: Int!
  ico: String!
  dic: String!
  ic_dph: String!
  country: String!
  city: String!
  street: String!
  zip: String!
  email: String!
  phone: String!
  description: String!

  monthly: Boolean!
  monthlyPausal: Float!
  taskWorkPausal: Float!
  taskTripPausal: Float!

  pricelist: Pricelist!
  users: [BasicUser]
  companyRents: [CompanyRent]
}

type BasicCompany {
  id: Int!
  title: String!
  dph: Int!
  pricelist: Pricelist!
  users: [BasicUser]
  companyRents: [CompanyRent]
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

export const CompanyQuerries = `
companies: [Company]
company(id: Int!): Company
basicCompanies: [BasicCompany]
basicCompany(id: Int!): BasicCompany
`

export const CompanyMutations = `
addCompany( title: String!, dph: Int!, ico: String!, dic: String!, ic_dph: String!, country: String!, city: String!, street: String!, zip: String!, email: String!, phone: String!, description: String!, pricelistId: Int!, monthly: Boolean!, monthlyPausal: Float!, taskWorkPausal: Float!, taskTripPausal: Float!, rents: [CompanyRentCreateInput]! ): Company
updateCompany( id: Int!, title: String, dph: Int, ico: String, dic: String, ic_dph: String, country: String, city: String, street: String, zip: String, email: String, phone: String, description: String, pricelistId: Int, monthly: Boolean, monthlyPausal: Float, taskWorkPausal: Float, taskTripPausal: Float, rents: [CompanyRentUpdateInput] ): Company
deleteCompany( id: Int!, newId: Int! ): Company
`