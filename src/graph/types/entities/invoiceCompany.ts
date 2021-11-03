import defaultAttributes from './defaultAttributes';
export const InvoiceCompany = `
type InvoiceCompany {
  company: BasicCompany!
  works: Float!
  trips: Float!
  materials: Float!
}

type DatePairs {
  month: Int!
  year: Int!
}

type BasicInvoiceCompany {
  id: Int!
  title: String!
}
`

export const InvoiceCompanyQueries = `
  invoiceCompanies(fromDate: String!, toDate: String!): [InvoiceCompany]
  companiesWithInvoice(fromDate: String!, toDate: String!): [BasicCompany]
  invoiceDatesOfCompany(companyId: Int!): [DatePairs]
  allInvoiceCompanies: [BasicInvoiceCompany]
`

export const InvoiceCompanyMutations = `
`
