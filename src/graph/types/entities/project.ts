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
  projectFilters: [Filter]
  milestones: [Milestone]!
  imaps: [Imap]!
  attributeRights: ProjectGroupAttributeRights
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
  projectFilters: [BasicFilter]
  milestones: [Milestone]!
  attributeRights: ProjectGroupAttributeRights!
  right: ProjectGroupRights!
  tags: [Tag]!
  statuses: [Status]!
  groups: [ProjectGroup]!
}

type MyProject {
  project: BasicProject!
  attributeRights: ProjectGroupAttributeRights!
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
  filters: [ProjectFilterInput]!
  userGroups: [UserGroupInput]!
  companyGroups: [CompanyGroupInput]!
  groups: [ProjectGroupInput]!
): Project

updateProject(
  id: Int!
  title: String
  description: String
  lockedRequester: Boolean
  autoApproved: Boolean
  hideApproved: Boolean
  archived: Boolean
  projectAttributes: ProjectAttributesInput

  addTags: [NewTagInput]!
  updateTags: [TagUpdateInput]!
  deleteTags: [Int]!

  addStatuses: [NewStatusInput]!
  updateStatuses: [UpdateStatusInput]!
  deleteStatuses: [Int]!

  addFilters: [ProjectFilterInput]!
  updateFilters: [ProjectFilterInput]!
  deleteFilters: [Int]!

  userGroups: [UserGroupUpdateInput]!
  companyGroups: [CompanyGroupUpdateInput]!

  addGroups: [ProjectGroupInput]!
  updateGroups: [ProjectGroupInput]!
  deleteGroups: [Int]!
): Project

deleteProject( id: Int!, newId: Int! ): Project
`

export const ProjectSubscriptions = `
  projectsSubscription: Boolean
`
