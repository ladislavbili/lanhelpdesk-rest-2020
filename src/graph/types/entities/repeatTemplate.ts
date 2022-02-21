import defaultAttributes from './defaultAttributes';

export const RepeatTemplate = `
type RepeatTemplate {
  ${defaultAttributes}
  title: String!
  important: Boolean!,
  closeDate: String
  assignedTo: [BasicUser]!
  company: Company!
  createdBy: BasicUser
  daysToDeadline: Int
  description: String!
  milestone: Milestone
  overtime: Boolean!
  pausal: Boolean!
  pendingChangable: Boolean!
  pendingDate: String
  project: Project!
  requester: BasicUser
  status: Status!
  statusChange: String!
  tags: [Tag]!
  taskType: TaskType

  repeat: Repeat!
  repeatTemplateAttachments: [RepeatTemplateAttachment]!
  shortSubtasks: [ShortSubtask]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
}

input RepeatTemplateAddInput {
  title: String!
  important: Boolean
  closeDate: String
  assignedTo: [Int]
  company: Int
  daysToDeadline: Int
  description: String!
  milestone: Int
  overtime: Boolean!
  pausal: Boolean!
  pendingChangable: Boolean
  pendingDate: String
  project: Int!
  requester: Int
  status: Int!
  tags: [Int]!
  taskType: Int

  shortSubtasks: [ShortSubtaskInput]
  subtasks: [SubtaskInput]
  workTrips: [WorkTripInput]
  materials: [MaterialInput]
}

input RepeatTemplateUpdateInput {
  title: String
  important: Boolean
  closeDate: String
  assignedTo: [Int]
  company: Int
  daysToDeadline: Int
  description: String
  milestone: Int
  overtime: Boolean
  pausal: Boolean
  pendingChangable: Boolean
  pendingDate: String
  project: Int
  requester: Int
  status: Int
  tags: [Int]
  taskType: Int
}
`

export const RepeatTemplateQueries = `
`

export const RepeatTemplateMutations = `
`
