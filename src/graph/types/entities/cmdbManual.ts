import defaultAttributes from './defaultAttributes';
export const CMDBManual = `
type CMDBManual {
  ${defaultAttributes}
  title: String!
  body: String!
  createdBy: BasicUser
  updatedBy: BasicUser
  images: [CMDBFile]!
}

enum EnumCMDBManualSort {
  id
  title
  updatedAt
}

input CMDBManualStringFilterInput {
  title: String
}

type CMDBManuals {
  manuals: [CMDBManual]!
  count: Int!
}
`

export const CMDBManualQueries = `
cmdbManuals(companyId: Int!, order: EnumCMDBManualSort!, limit: Int, page: Int, stringFilter: CMDBManualStringFilterInput): CMDBManuals
cmdbManual(id: Int!): CMDBManual
`

export const CMDBManualMutations = `
addCmdbManual( title: String!, body: String!, companyId: Int! ): CMDBManual
updateCmdbManual( id: Int!, title: String!, body: String!, deletedImages: [Int] ): CMDBManual
deleteCmdbManual( id: Int! ): CMDBManual
`

export const CMDBManualSubscriptions = `
  cmdbManualsSubscription(companyId: Int!): Int
`
