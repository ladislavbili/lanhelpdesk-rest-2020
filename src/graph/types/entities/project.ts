import defaultAttributes from './defaultAttributes';

export const Project = `
type Project {
  ${defaultAttributes}
  title: String!
  description: String!
  lockedRequester: Boolean!
  autoApproved: Boolean!
  hideApproved: Boolean!
  archived: Boolean!
  projectAttributes: ProjectAttributes!
  filters: [BasicFilter]
  milestones: [Milestone]!
  imaps: [Imap]!
  right: ProjectGroupRights
  tags: [Tag]!
  statuses: [Status]!
  groups: [ProjectGroup]!
  attachments: [ProjectAttachment]!
}

type BasicProject {
  ${defaultAttributes}
  title: String!
  lockedRequester: Boolean!
  autoApproved: Boolean!
  hideApproved: Boolean!
  archived: Boolean!
  description: String!
  projectAttributes: ProjectAttributes!
  filters: [BasicFilter]
  milestones: [Milestone]!
  right: ProjectGroupRights!
  tags: [Tag]!
  statuses: [Status]!
  groups: [ProjectGroup]!
}

type MyProject {
  project: BasicProject!
  right: ProjectGroupRights!
  usersWithRights: [UserWithRights]!
}

type UserWithRights {
  user: BasicUser!
  assignable: Boolean!
}
`

export const ProjectQueries = `
projects: [Project]
project(id: Int!): Project
myProjects: [MyProject]!
`

export const ProjectMutations = `
addProject(
  title: String!,
  description: String!,
  lockedRequester: Boolean!,
  autoApproved: Boolean!,
  hideApproved: Boolean!,
  archived: Boolean!,
  projectAttributes: ProjectAttributesInput!,
  tags: [NewTagInput]!,
  statuses: [NewStatusInput]!
  groups: [ProjectGroupInput]!
  userGroups: [UserGroupInput]!
): Project

updateProject(
  id: Int!,
  title: String,
  description: String,
  lockedRequester: Boolean,
  autoApproved: Boolean,
  hideApproved: Boolean,
  archived: Boolean,
  projectAttributes: ProjectAttributesInput,
  deleteTags: [Int]!,
  updateTags: [TagUpdateInput]!,
  addTags: [NewTagInput]!,
  deleteStatuses: [Int]!,
  updateStatuses: [UpdateStatusInput]!,
  addStatuses: [NewStatusInput]!,
  userGroups: [UserGroupUpdateInput]!,
  addGroups: [ProjectGroupInput]!,
  updateGroups: [ProjectGroupInput]!,
  deleteGroups: [Int]!,
): Project

deleteProject( id: Int!, newId: Int! ): Project
`

export const ProjectSubscriptions = `
  projectsSubscription: Boolean
`
