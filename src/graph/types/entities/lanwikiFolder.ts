import defaultAttributes from './defaultAttributes';
export const LanwikiFolder = `
type LanwikiFolder {
  ${defaultAttributes}
  title: String!
  archived: Boolean!
  order: Int!
  description: String!
  folderRights: [LanwikiFolderRight]!
  myRights: LanwikiFolderRight!
  folderUsers: [BasicUser]!
}

type LanwikiFolderRight {
  active: Boolean!
  read: Boolean!
  write: Boolean!
  manage: Boolean!
  user: BasicUser!
}

input LanwikiFolderRightInput {
  active: Boolean!
  read: Boolean!
  write: Boolean!
  manage: Boolean!
  userId: Int!
}
`

export const LanwikiFolderQueries = `
lanwikiUsers: [BasicUser]
lanwikiFolders(archived: Boolean): [LanwikiFolder]
lanwikiFolder(id: Int!): LanwikiFolder
`

export const LanwikiFolderMutations = `
addLanwikiFolder( title: String!, archived: Boolean!, order: Int!, description: String!, folderRights: [LanwikiFolderRightInput]! ): LanwikiFolder
updateLanwikiFolder( id: Int!, title: String!, archived: Boolean!, order: Int!, description: String!, folderRights: [LanwikiFolderRightInput]! ): LanwikiFolder
deleteLanwikiFolder( id: Int!, newId: Int ): LanwikiFolder
`

export const LanwikiFolderSubscriptions = `
  lanwikiFolderSubscription: [Int]
`
