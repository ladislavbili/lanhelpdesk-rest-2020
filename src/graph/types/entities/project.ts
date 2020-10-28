import defaultAttributes from './defaultAttributes';
import projectExtra from './projectExtra';

export const Project = `
type Project {
  ${defaultAttributes}
  title: String!
  description: String!
  lockedRequester: Boolean!
  projectRights: [ProjectRight]!
  def: ProjectDefaults!
  filters: [BasicFilter]
  milestones: [Milestone]!
  imaps: [Imap]!
}

type BasicProject {
  ${defaultAttributes}
  title: String!
  description: String!
  def: ProjectDefaults!
  filters: [BasicFilter]
  milestones: [Milestone]!
}


type MyProject {
  project: BasicProject!
  right: ProjectRight!
}


${projectExtra}
`

export const ProjectQuerries = `
projects: [Project]
project(id: Int!): Project
myProjects: [MyProject]!
`

export const ProjectMutations = `
addProject( title: String!, description: String!, lockedRequester: Boolean!, projectRights: [ProjectRightInput]!, def: ProjectDefaultsInput! ): Project
updateProject( id: Int!, title: String, description: String, lockedRequester: Boolean, projectRights: [ProjectRightInput], def: ProjectDefaultsInput ): Project
deleteProject( id: Int!, newId: Int! ): Project
`
