import defaultAttributes from './defaultAttributes';
export const Milestone = `
type Milestone {
  ${defaultAttributes}
  title: String!
  description: String!
  startsAt: String!
  endsAt: String!
  project: Project!
}
`

export const MilestoneQuerries = `
milestone(id: Int!): Milestone
`

export const MilestoneMutations = `
addMilestone( title: String!, description: String!, startsAt: Int, endsAt: Int, projectId: Int! ): Milestone
updateMilestone( id: Int!, title: String, description: String, startsAt: Int, endsAt: Int ): Milestone
deleteMilestone( id: Int! ): Milestone
`
