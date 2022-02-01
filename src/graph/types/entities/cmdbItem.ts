import defaultAttributes from './defaultAttributes';
export const CMDBItem = `
type CMDBItem {
  ${defaultAttributes}
  title: String!
  active: Boolean!
  location: String!
  installDate: String
  expireDate: String
  description: String!
  backup: String!
  monitoring: String!
  hardware: String!
  serialNumber: String!

  createdBy: BasicUser
  updatedBy: BasicUser
  company: BasicCompany!
  category: CMDBCategory!

  descriptionImages: [CMDBFile]!
  backupImages: [CMDBFile]!
  monitoringImages: [CMDBFile]!
  addresses: [CMDBAddress]!
}

enum EnumCMDBItemSort {
  id
  title
  active
  updatedAt
}

input CMDBItemStringFilterInput {
  title: String
  active: Boolean
  location: String
  company: String
  category: String
  installDateFrom: String
  installDateTo: String
  expireDateFrom: String
  expireDateTo: String
  ips: String!
}

type CMDBItems {
  items: [CMDBItem]!
  count: Int!
}
`

export const CMDBItemQueries = `
cmdbItems(
  companyId: Int
  categoryId: Int
  limit: Int
  page: Int
  stringFilter: CMDBItemStringFilterInput
  sort: EnumCMDBItemSort!
): CMDBItems
cmdbItem(id: Int!): CMDBItem
`

export const CMDBItemMutations = `
addCmdbItem(
  companyId: Int!
  categoryId: Int!
  title: String!
  active: Boolean!
  location: String!
  installDate: String
  expireDate: String
  hardware: String!
  serialNumber: String!
  description: String!
  backup: String!
  monitoring: String!
  addresses: [CMDBAddressInput]!
 ): CMDBItem
updateCmdbItem(
  id: Int!
  companyId: Int
  categoryId: Int
  title: String!
  active: Boolean!
  location: String!
  installDate: String
  expireDate: String
  hardware: String!
  serialNumber: String!
  description: String!
  backup: String!
  monitoring: String!
  deletedImages: [Int]
): CMDBItem
deleteCmdbItem( id: Int! ): CMDBItem
`

export const CMDBItemSubscriptions = `
`
