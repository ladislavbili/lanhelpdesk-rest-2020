import defaultAttributes from './defaultAttributes';
export const LanwikiPage = `
type LanwikiPage {
  ${defaultAttributes}
  createdBy: BasicUser
  updatedBy: BasicUser
  title: String!
  body: String!
  folder: LanwikiFolder!
  tags: [LanwikiTag]!
  myRights: LanwikiFolderRight!
  images: [LanwikiFile]!
}

input LanwikiPageStringFilterInput {
  title: String
  tags: String
  folder: String
}

type LanwikiFile {
  id: Int!
  filename: String!
  path: String!
  mimetype: String!
  encoding: String!
  size: Int!
}

type LanwikiPages {
  pages: [LanwikiPage]!
  count: Int!
}
`

export const LanwikiPageQueries = `
lanwikiPages(folderId: Int, tagId: Int, limit: Int, page: Int, stringFilter: LanwikiPageStringFilterInput, archived: Boolean): LanwikiPages
lanwikiPage(id: Int!): LanwikiPage
`

export const LanwikiPageMutations = `
addLanwikiPage( title: String!, body: String!, folderId: Int!, tags: [Int]! ): LanwikiPage
updateLanwikiPage( id: Int!, title: String!, body: String!, folderId: Int, tags: [Int], deletedImages: [Int] ): LanwikiPage
deleteLanwikiPage( id: Int! ): LanwikiPage
`

export const LanwikiPageSubscriptions = `
  lanwikiPagesSubscription: [Int]
`
