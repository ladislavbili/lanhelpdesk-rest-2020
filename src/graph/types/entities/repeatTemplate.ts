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
  deadline: String
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
  scheduled: [ScheduledTask]!
  shortSubtasks: [ShortSubtask]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
  customItems: [CustomItem]!
}

input RepeatTemplateAddInput {
  title: String!
  important: Boolean
  closeDate: String
  assignedTo: [Int]!
  company: Int!
  deadline: String
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

  scheduled: [ScheduledTaskInput]
  shortSubtasks: [ShortSubtaskInput]
  subtasks: [SubtaskInput]
  workTrips: [WorkTripInput]
  materials: [MaterialInput]
  customItems: [CustomItemInput]
}
input RepeatTemplateUpdateInput {
  title: String
  important: Boolean
  closeDate: String
  assignedTo: [Int]
  company: Int
  deadline: String
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

export const RepeatTemplateQuerries = `
`

export const RepeatTemplateMutations = `
`

export const TaskSubscriptions = `
`