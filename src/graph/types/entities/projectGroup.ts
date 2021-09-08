import defaultAttributes from './defaultAttributes';

export const ProjectGroup = `
type ProjectGroup {
  ${defaultAttributes}
  def: Boolean!
  title: String!
  description: String!
  order: Int!
  users: [BasicUser]!
  rights: ProjectGroupRights!
  attributeRights: ProjectGroupAttributeRights!
  project: Project!
}

type ProjectGroupRights {
  assignedRead: Boolean!
  assignedWrite: Boolean!
  companyRead: Boolean!
  companyWrite: Boolean!
  deadlineRead: Boolean!
  deadlineWrite: Boolean!
  milestoneRead: Boolean!
  milestoneWrite: Boolean!
  overtimeRead: Boolean!
  overtimeWrite: Boolean!
  pausalRead: Boolean!
  pausalWrite: Boolean!
  projectRead: Boolean!
  projectWrite: Boolean!
  projectPrimaryRead: Boolean!
  projectPrimaryWrite: Boolean!
  repeatRead: Boolean!
  repeatWrite: Boolean!
  requesterRead: Boolean!
  requesterWrite: Boolean!
  rozpocetRead: Boolean!
  rozpocetWrite: Boolean!
  scheduledRead: Boolean!
  scheduledWrite: Boolean!
  statusRead: Boolean!
  statusWrite: Boolean!
  tagsRead: Boolean!
  tagsWrite: Boolean!
  taskAttachmentsRead: Boolean!
  taskAttachmentsWrite: Boolean!
  taskDescriptionRead: Boolean!
  taskDescriptionWrite: Boolean!
  taskShortSubtasksRead: Boolean!
  taskShortSubtasksWrite: Boolean!
  typeRead: Boolean!
  typeWrite: Boolean!
  vykazRead: Boolean!
  vykazWrite: Boolean!
  addComments: Boolean!
  emails: Boolean!
  history: Boolean!
  internal: Boolean!
  projectSecondary: Boolean!
  pausalInfo: Boolean!
  taskTitleEdit: Boolean!
  viewComments: Boolean!
  companyTasks: Boolean!
  allTasks: Boolean!
  addTasks: Boolean!
  deleteTasks: Boolean!
  important: Boolean!
  statistics: Boolean!
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
  assignedRead: Boolean!
  assignedWrite: Boolean!
  companyRead: Boolean!
  companyWrite: Boolean!
  deadlineRead: Boolean!
  deadlineWrite: Boolean!
  milestoneRead: Boolean!
  milestoneWrite: Boolean!
  overtimeRead: Boolean!
  overtimeWrite: Boolean!
  pausalRead: Boolean!
  pausalWrite: Boolean!
  projectRead: Boolean!
  projectWrite: Boolean!
  projectPrimaryRead: Boolean!
  projectPrimaryWrite: Boolean!
  repeatRead: Boolean!
  repeatWrite: Boolean!
  requesterRead: Boolean!
  requesterWrite: Boolean!
  rozpocetRead: Boolean!
  rozpocetWrite: Boolean!
  scheduledRead: Boolean!
  scheduledWrite: Boolean!
  statusRead: Boolean!
  statusWrite: Boolean!
  tagsRead: Boolean!
  tagsWrite: Boolean!
  taskAttachmentsRead: Boolean!
  taskAttachmentsWrite: Boolean!
  taskDescriptionRead: Boolean!
  taskDescriptionWrite: Boolean!
  taskShortSubtasksRead: Boolean!
  taskShortSubtasksWrite: Boolean!
  typeRead: Boolean!
  typeWrite: Boolean!
  vykazRead: Boolean!
  vykazWrite: Boolean!
  addComments: Boolean!
  emails: Boolean!
  history: Boolean!
  internal: Boolean!
  projectSecondary: Boolean!
  pausalInfo: Boolean!
  taskTitleEdit: Boolean!
  viewComments: Boolean!
  companyTasks: Boolean!
  allTasks: Boolean!
  addTasks: Boolean!
  deleteTasks: Boolean!
  important: Boolean!
  statistics: Boolean!
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

input UserGroupUpdateInput {
  groupId: Int!
  userIds: [Int]!
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
