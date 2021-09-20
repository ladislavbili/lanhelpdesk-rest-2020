import defaultAttributes from './defaultAttributes';

export const ProjectGroup = `
type ProjectGroup {
  ${defaultAttributes}
  admin: Boolean!
  def: Boolean!
  title: String!
  description: String!
  order: Int!
  users: [BasicUser]!
  companies: [BasicCompany]!
  rights: ProjectGroupRights!
  attributeRights: ProjectGroupAttributeRights!
  project: Project!
}

type BasicProjectGroup {
  ${defaultAttributes}
  admin: Boolean!
  def: Boolean!
  title: String!
  description: String!
  order: Int!
}

type ProjectGroupRights {
  projectRead: Boolean!
  projectWrite: Boolean!

  companyTasks: Boolean!
  allTasks: Boolean!

  tasklistDnD: Boolean!
  tasklistKalendar: Boolean!
  tasklistGantt: Boolean!
  tasklistStatistics: Boolean!

  addTask: Boolean!

  deleteTask: Boolean!
  taskImportant: Boolean!
  taskTitleWrite: Boolean!
  taskProjectWrite: Boolean!
  taskDescriptionRead: Boolean!
  taskDescriptionWrite: Boolean!
  taskAttachmentsRead: Boolean!
  taskAttachmentsWrite: Boolean!

  taskSubtasksRead: Boolean!
  taskSubtasksWrite: Boolean!
  taskWorksRead: Boolean!
  taskWorksWrite: Boolean!
  taskWorksAdvancedRead: Boolean!
  taskWorksAdvancedWrite: Boolean!
  taskMaterialsRead: Boolean!
  taskMaterialsWrite: Boolean!
  taskPausalInfo: Boolean!

  viewComments: Boolean!
  addComments: Boolean!
  internal: Boolean!
  emails: Boolean!
  history: Boolean!
}

type ProjectGroupAttributeRights {
  status: ProjectGroupAttributeRight!
  tags: ProjectGroupAttributeRight!
  assigned: ProjectGroupAttributeRight!
  requester: ProjectGroupAttributeRight!
  company: ProjectGroupAttributeRight!
  taskType: ProjectGroupAttributeRight!
  pausal: ProjectGroupAttributeRight!
  overtime: ProjectGroupAttributeRight!
  startsAt: ProjectGroupAttributeRight!
  deadline: ProjectGroupAttributeRight!
  repeat: ProjectGroupRepeatAttributeRight!
}

type ProjectGroupAttributeRight {
  required: Boolean!
  add: Boolean!
  view: Boolean!
  edit: Boolean!
}

type ProjectGroupRepeatAttributeRight {
  add: Boolean!
  view: Boolean!
  edit: Boolean!
}

input ProjectGroupInput {
  id: Int!
  def: Boolean
  admin: Boolean
  title: String!
  description: String!
  order: Int!
  rights: ProjectGroupRightInput!
  attributeRights: ProjectGroupAttributeRightsInput!
}

input ProjectGroupUpdateInput {
  id: Int!
  title: String
  description: String
  order: Int
  rights: ProjectGroupRightInput
  attributeRights: ProjectGroupAttributeRightsInput
}

input ProjectGroupRightInput {
  projectRead: Boolean!
  projectWrite: Boolean!

  companyTasks: Boolean!
  allTasks: Boolean!

  tasklistDnD: Boolean!
  tasklistKalendar: Boolean!
  tasklistGantt: Boolean!
  tasklistStatistics: Boolean!

  addTask: Boolean!

  deleteTask: Boolean!
  taskImportant: Boolean!
  taskTitleWrite: Boolean!
  taskProjectWrite: Boolean!
  taskDescriptionRead: Boolean!
  taskDescriptionWrite: Boolean!
  taskAttachmentsRead: Boolean!
  taskAttachmentsWrite: Boolean!

  taskSubtasksRead: Boolean!
  taskSubtasksWrite: Boolean!
  taskWorksRead: Boolean!
  taskWorksWrite: Boolean!
  taskWorksAdvancedRead: Boolean!
  taskWorksAdvancedWrite: Boolean!
  taskMaterialsRead: Boolean!
  taskMaterialsWrite: Boolean!
  taskPausalInfo: Boolean!

  viewComments: Boolean!
  addComments: Boolean!
  internal: Boolean!
  emails: Boolean!
  history: Boolean!
}

input ProjectGroupAttributeRightsInput {
  status: ProjectGroupAttributeRightInput!
  tags: ProjectGroupAttributeRightInput!
  assigned: ProjectGroupAttributeRightInput!
  requester: ProjectGroupAttributeRightInput!
  company: ProjectGroupAttributeRightInput!
  taskType: ProjectGroupAttributeRightInput!
  pausal: ProjectGroupAttributeRightInput!
  overtime: ProjectGroupAttributeRightInput!
  startsAt: ProjectGroupAttributeRightInput!
  deadline: ProjectGroupAttributeRightInput!
  repeat: ProjectGroupRepeatAttributeRightInput!
}

input ProjectGroupAttributeRightInput {
  required: Boolean!
  add: Boolean!
  view: Boolean!
  edit: Boolean!
}

input ProjectGroupRepeatAttributeRightInput {
  add: Boolean!
  view: Boolean!
  edit: Boolean!
}


input UserGroupInput {
  userId: Int!
  groupId: Int!
}

input CompanyGroupInput {
  companyId: Int!
  groupId: Int!
}

input UserGroupUpdateInput {
  groupId: Int!
  userIds: [Int]!
}

input CompanyGroupUpdateInput {
  groupId: Int!
  companyIds: [Int]!
}
`

export const ProjectGroupQueries = `
  projectGroups(id: Int!): [ProjectGroup]
`

export const ProjectGroupMutations = `
  addUserToProjectGroup( id: Int!, userId: Int! ): ProjectGroup
`

export const ProjectGroupSubscriptions = `
  projectGroupsSubscription(projectId: Int!): Int
`
