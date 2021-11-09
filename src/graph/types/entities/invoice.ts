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

  type InvoiceAgent {
    user: BasicUser
    works: Float!
    trips: Float!
  }

  type AgentInvoice {
    workTasks: [Task]!
    tripTasks: [Task]!
    taskTypeTotals: [AgentTypeTotals]!
    tripTypeTotals: [AgentTypeTotals]!
    totals: AgentInvoiceTotals!
  }

  type AgentTypeTotals {
    id: Int!
    title: String!
    quantity: Float!
  }

  type AgentInvoiceTotals {
    workHours: Float!
    workOvertime: Float!
    workOvertimeTasks: [Int]!
    tripHours: Float!
    tripOvertime: Float!
    tripOvertimeTasks: [Int]!

    pausalWorkHours: Float!
    overPausalWorkHours: Float!
    projectWorkHours: Float!
    pausalTripHours: Float!
    overPausalTripHours: Float!
    projectTripHours: Float!
  }

`

export const InvoiceQueries = `
  companyInvoice( fromDate: String!, toDate: String!, companyId: Int! ): CompanyInvoice
  invoice( fromDate: String!, toDate: String!, companyId: Int! ): CompanyInvoice
  invoiceAgents( fromDate: String!, toDate: String!, statusActions: [StatusAllowedType]!, invoiced: Boolean! ): [InvoiceAgent]
  agentInvoice( fromDate: String!, toDate: String!, statusActions: [StatusAllowedType]!, invoiced: Boolean!, userId: Int  ): AgentInvoice
`

export const InvoiceMutations = `
  invoiceTasks( fromDate: String!, toDate: String!, companyId: Int!, taskIds: [Int]! ): Boolean
`
