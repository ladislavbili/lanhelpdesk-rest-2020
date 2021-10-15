import defaultAttributes from './defaultAttributes';
export const InvoiceCompany = `
type InvoiceCompany {
  company: BasicCompany!
  works: Float!
  trips: Float!
  materials: Float!
}
`

export const InvoiceCompanyQueries = `
invoiceCompanies(fromDate: String!, toDate: String!): [InvoiceCompany]
`

export const InvoiceCompanyMutations = `
`
