import defaultAttributes from './defaultAttributes';
import projectExtra from './projectExtra';

export const Project = `
type Project {
  ${defaultAttributes}
  title: String!
  description: String!
  lockedRequester: Boolean!
  autoApproved: Boolean!
  def: ProjectDefaults!
  filters: [BasicFilter]
  milestones: [Milestone]!
  imaps: [Imap]!
  right: ProjectGroupRights
  tags: [Tag]!
  statuses: [Status]!
  groups: [ProjectGroup]!
}

type BasicProject {
  ${defaultAttributes}
  title: String!
  lockedRequester: Boolean!
  autoApproved: Boolean!
  description: String!
  def: ProjectDefaults!
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

${projectExtra}
`

export const ProjectQuerries = `
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
  def: ProjectDefaultsInput!,
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
  def: ProjectDefaultsInput,
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
addUserToProject( projectId: Int!, userId: Int! ): Project
`

export const ProjectSubscriptions = `
  projectsSubscription: Boolean
`
