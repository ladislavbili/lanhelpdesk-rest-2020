import defaultAttributes from './defaultAttributes';
export const CMDBAddress = `
type CMDBAddress {
  ${defaultAttributes}
  nic: String!
  ip: String!
  mask: String!
  gateway: String!
  dns: String!
  vlan: String!
  note: String!
}

input CMDBAddressInput{
  nic: String!
  ip: String!
  mask: String!
  gateway: String!
  dns: String!
  vlan: String!
  note: String!
}
`

export const CMDBAddressQueries = `
`

export const CMDBAddressMutations = `
addCmdbAddress(
  itemId: Int!
  nic: String!
  ip: String!
  mask: String!
  gateway: String!
  dns: String!
  vlan: String!
  note: String!
): CMDBAddress
updateCmdbAddress(
  id: Int!
  nic: String!
  ip: String!
  mask: String!
  gateway: String!
  dns: String!
  vlan: String!
  note: String!

): CMDBAddress
deleteCmdbAddress( id: Int! ): CMDBAddress
`
