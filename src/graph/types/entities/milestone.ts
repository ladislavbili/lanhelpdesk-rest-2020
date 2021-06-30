import defaultAttributes from './defaultAttributes';
export const Milestone = `
type Milestone {
  ${defaultAttributes}
  title: String!
  order: Int
  description: String!
  startsAt: String
  endsAt: String
  project: Project!
  tasks: [Task]!
}
`

export const MilestoneQueries = `
milestone(id: Int!): Milestone
`

export const MilestoneMutations = `
addMilestone( title: String!, description: String!, startsAt: String, endsAt: String, projectId: Int!, order: Int ): Milestone
updateMilestone( id: Int!, title: String, description: String, startsAt: String, endsAt: String, order: Int ): Milestone
deleteMilestone( id: Int! ): Milestone
`

export const MilestoneSubscriptions = `
  milestonesSubscription: Boolean
`
