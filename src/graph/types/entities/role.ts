import defaultAttributes from './defaultAttributes';

export const Role = `
type Role {
  ${defaultAttributes}
  title: String!,
  order: Int!,

  accessRights: AccessRights @AccessDirective( access:["roles"] ),
  currentUsers: [User],
}

type AccessRights {
  login: Boolean!,
  testSections: Boolean!,
  mailViaComment: Boolean!,
  vykazy: Boolean!,
  publicFilters: Boolean!,
  addProjects: Boolean!,
  viewVykaz: Boolean!,
  viewRozpocet: Boolean!,
  viewErrors: Boolean!,
  viewInternal: Boolean!,

  users: Boolean!,
  companies: Boolean!,
  pausals: Boolean!,
  projects: Boolean!,
  statuses: Boolean!,
  units: Boolean!,
  prices: Boolean!,
  suppliers: Boolean!,
  tags: Boolean!,
  invoices: Boolean!,
  roles: Boolean!,
  types: Boolean!,
  tripTypes: Boolean!,
  imaps: Boolean!,
  smtps: Boolean!,
}
`

export const RoleQuerries = `
roles: [Role],
role(id: Int!): Role,
accessRights: AccessRights
`

export const RoleMutations = `
addRole( title: String!, order: Int, login: Boolean!, testSections: Boolean!, mailViaComment: Boolean!, vykazy: Boolean!, publicFilters: Boolean!, addProjects: Boolean!, viewVykaz: Boolean!, viewRozpocet: Boolean!, viewErrors: Boolean!, viewInternal: Boolean!, users: Boolean!, companies: Boolean!, pausals: Boolean!, projects: Boolean!, statuses: Boolean!, units: Boolean!, prices: Boolean!, suppliers: Boolean!, tags: Boolean!, invoices: Boolean!, roles: Boolean!, types: Boolean!, tripTypes: Boolean!, imaps: Boolean!, smtps: Boolean! ): Role,
updateRole( id: Int!, title: String, order: Int, login: Boolean, testSections: Boolean, mailViaComment: Boolean, vykazy: Boolean, publicFilters: Boolean, addProjects: Boolean, viewVykaz: Boolean, viewRozpocet: Boolean, viewErrors: Boolean, viewInternal: Boolean, users: Boolean, companies: Boolean, pausals: Boolean, projects: Boolean, statuses: Boolean, units: Boolean, prices: Boolean, suppliers: Boolean, tags: Boolean, invoices: Boolean, roles: Boolean, types: Boolean, tripTypes: Boolean, imaps: Boolean, smtps: Boolean ): Role,
deleteRole( id: Int!, newId: Int! ): Role,
`
