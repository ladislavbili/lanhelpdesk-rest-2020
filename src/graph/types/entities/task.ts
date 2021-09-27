import defaultAttributes from './defaultAttributes';
import { createExecClass } from '@/helperFunctions';

export const Task = `
type Task {
  ${defaultAttributes}
  title: String!
  important: Boolean!
  closeDate: String
  assignedTo: [BasicUser]!
  company: Company
  createdBy: BasicUser
  startsAt: String
  deadline: String
  invoicedDate: String
  description: String!
  milestone: Milestone
  overtime: Boolean!
  pausal: Boolean!
  pendingChangable: Boolean!
  pendingDate: String
  project: Project
  requester: BasicUser
  status: Status
  statusChange: String!
  tags: [Tag]!
  taskType: TaskType
  invoiced: Boolean!
  ganttOrder: Int

  attributeRights: ProjectGroupAttributeRights
  rights: ProjectGroupRights
  repeat: Repeat
  metadata: TaskMetadata!
  comments: [Comment]!
  shortSubtasks: [ShortSubtask]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
  customItems: [CustomItem]!
  taskChanges: [TaskChange]!
  taskAttachments: [TaskAttachment]!
  repeatTime: RepeatTime

  subtasksQuantity: Float
  approvedSubtasksQuantity: Float
  pendingSubtasksQuantity: Float
  workTripsQuantity: Float
  materialsPrice: Float
  approvedMaterialsPrice: Float
  pendingMaterialsPrice: Float
}

input CommentInput{
  message: String!
  internal: Boolean!
}

input SubtaskInput{
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean
  quantity: Float!
  discount: Float!
  type: Int!
  assignedTo: Int!
  scheduled: ScheduledWorkInput
}

input WorkTripInput{
  order: Int!
  done: Boolean!
  approved: Boolean
  quantity: Float!
  discount: Float!
  type: Int!
  assignedTo: Int!
  scheduled: ScheduledWorkInput
}

input MaterialInput{
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean
  quantity: Float!
  margin: Float!
  price: Float!
}

input CustomItemInput{
  title: String!
  order: Int!
  done: Boolean!
  approved: Boolean
  quantity: Float!
  price: Float!
}

type TasksDifference{
  type: EnumSubTaskChanged!
  data: Task
  ids: [Int]
}

enum EnumSubTaskChanged{
  add
  delete
  update
}

type TasksTotals{
  approvedSubtasks: Float!
  pendingSubtasks: Float!
  approvedMaterials: Float!
  pendingMaterials: Float!
}

${createExecClass("Task", false, 'count: Int! totals: TasksTotals! ')}
${createExecClass("Task", true)}

enum EnumSortTaskKey {
  id
  important
  title
  status
  requester
  assignedTo
  startsAt
  createdAt
  deadline
  updatedAt
}

input SortTasksInput {
  key: EnumSortTaskKey!
  asc: Boolean!
}

input StringFilterInput {
  id: String
  status: String
  title: String
  requester: String
  company: String
  createdAtFrom: String
  createdAtTo: String
  startsAtFrom: String
  startsAtTo: String
  deadlineFrom: String
  deadlineTo: String
  project: String
  taskType: String
  milestone: String
  assignedTo: String
  tags: String
  overtime: String
  pausal: String
}
`

export const TaskQueries = `
tasks(
  projectId: Int
  milestoneId: Int
  filter: FilterInput
  sort: SortTasksInput
  milestoneSort: Boolean
  search: String
  stringFilter: StringFilterInput
  limit: Int
  page: Int
  statuses: [Int]
): ExecTasks
task(id: Int!): Task
oldTask(id: Int!): Task
getNumberOfTasks( projectId: Int! ): Int!
`

export const TaskMutations = `
addTask(
  title: String!
  important: Boolean
  closeDate: String
  assignedTo: [Int]!
  company: Int!
  startsAt: String
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
  repeat: TaskRepeatInput
  ganttOrder: Int
  comments: [CommentInput]
  shortSubtasks: [ShortSubtaskInput]
  subtasks: [SubtaskInput]
  workTrips: [WorkTripInput]
  materials: [MaterialInput]
  customItems: [CustomItemInput]
): Task

updateTask(
  id: Int!
  title: String
  important: Boolean
  closeDate: String
  assignedTo: [Int]
  company: Int
  startsAt: String
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
  invoiced: Boolean
  ganttOrder: Int
): Task
deleteTask( id: Int! ): Task
`

export const TaskSubscriptions = `
tasksSubscription: Boolean
taskAddSubscription: Int
taskDeleteSubscription( taskId: Int! ): Int
`
