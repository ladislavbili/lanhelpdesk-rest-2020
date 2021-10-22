import defaultAttributes from './defaultAttributes';
export const Invoice = `
  type CompanyInvoice {
    pausalTasks: [Task]!
    overPausalTasks: [Task]!
    projectTasks: [Task]!
    materialTasks: [Task]!
    pausalTotals: InvoicePausalTotals!
    overPausalTotals: InvoiceProjectTotals!
    projectTotals: InvoiceProjectTotals!
    materialTotals: InvoiceMaterialTotals!
  }

  type InvoicePausalTotals {
    workHours: Float!
    workOvertime: Float!
    workOvertimeTasks: [Int]!
    workExtraPrice: Float!
    tripHours: Float!
    tripOvertime: Float!
    tripOvertimeTasks: [Int]!
    tripExtraPrice: Float!
  }

  type InvoiceProjectTotals {
    workHours: Float!
    workOvertime: Float!
    workOvertimeTasks: [Int]!
    workExtraPrice: Float!
    workTotalPrice: Float!
    workTotalPriceWithDPH: Float!
    tripHours: Float!
    tripOvertime: Float!
    tripOvertimeTasks: [Int]!
    tripExtraPrice: Float!
    tripTotalPrice: Float!
    tripTotalPriceWithDPH: Float!
  }

  type InvoiceMaterialTotals {
    price: Float!
    priceWithDPH: Float!
  }
`

export const InvoiceQueries = `
  companyInvoice(fromDate: String!, toDate: String!, companyId: Int!): CompanyInvoice
`

export const InvoiceMutations = `
`
