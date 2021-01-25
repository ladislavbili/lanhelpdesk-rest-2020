import defaultAttributes from './defaultAttributes';
import projectExtra from './projectExtra';

export const ProjectGroup = `
type ProjectGroup {
  ${defaultAttributes}
  title: String!
  order: Int!
  users: [BasicUser]!
  rights: ProjectGroupRights!
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
  deleteTasks: Boolean!
  important: Boolean!
}

input ProjectGroupInput {
  id: Int!,
  title: String!
  order: Int!
  rights: ProjectGroupRightInput!
}

input ProjectGroupUpdateInput {
  id: Int!
  title: String
  order: Int
  rights: ProjectGroupRightInput
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
  deleteTasks: Boolean!
  important: Boolean!
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

export const ProjectGroupQuerries = `
`

export const ProjectGroupMutations = `
`
