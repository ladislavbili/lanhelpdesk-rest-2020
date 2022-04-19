import defaultAttributes from './defaultAttributes';
export const PassFolder = `
type PassFolder {
  ${defaultAttributes}
  title: String!
  order: Int!
  description: String!
  folderRights: [PassFolderRight]!
  myRights: PassFolderRight!
  folderUsers: [BasicUser]!
}

type PassFolderRight {
  active: Boolean!
  read: Boolean!
  write: Boolean!
  manage: Boolean!
  user: BasicUser!
}

input PassFolderRightInput {
  active: Boolean!
  read: Boolean!
  write: Boolean!
  manage: Boolean!
  userId: Int!
}
`

export const PassFolderQueries = `
passUsers: [BasicUser]
passFolders: [PassFolder]
passFolder(id: Int!): PassFolder
`

export const PassFolderMutations = `
addPassFolder( title: String!, order: Int!, description: String!, folderRights: [PassFolderRightInput]! ): PassFolder
updatePassFolder( id: Int!, title: String!, order: Int!, description: String!, folderRights: [PassFolderRightInput]! ): PassFolder
deletePassFolder( id: Int!, newId: Int ): PassFolder
`

export const PassFolderSubscriptions = `
  passFolderSubscription: [Int]
`
