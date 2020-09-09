import defaultAttributes from './defaultAttributes';
export const Milestone = `
type Milestone {
  ${defaultAttributes}
  title: String!
  description: String!
  startsAt: String!
  endsAt: String!
  project: Project!
  tasks: [Task]!
}
`

export const MilestoneQuerries = `
milestone(id: Int!): Milestone
`

export const MilestoneMutations = `
addMilestone( title: String!, description: String!, startsAt: String, endsAt: String, projectId: Int! ): Milestone
updateMilestone( id: Int!, title: String, description: String, startsAt: String, endsAt: String ): Milestone
deleteMilestone( id: Int! ): Milestone
`
