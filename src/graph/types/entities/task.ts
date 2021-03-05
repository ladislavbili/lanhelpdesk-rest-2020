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

  repeat: Repeat
  metadata: TaskMetadata!
  comments: [Comment]!
  scheduled: [ScheduledTask]!
  shortSubtasks: [ShortSubtask]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
  customItems: [CustomItem]!
  calendarEvents: [CalendarEvent]!
  taskChanges: [TaskChange]!
  taskAttachments: [TaskAttachment]!
  invoicedTasks: [InvoicedTask]!
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
}

input WorkTripInput{
  order: Int!
  done: Boolean!
  approved: Boolean
  quantity: Float!
  discount: Float!
  type: Int!
  assignedTo: Int!
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

${createExecClass("Task", false)}
${createExecClass("Task", true)}

enum EnumSortTaskKey {
  id
  title
  status
  requester
  assignedTo
  createdAt
  deadline
}

input SortTasksInput {
  key: EnumSortTaskKey!
  asc: Boolean!
}
`

export const TaskQuerries = `
tasks( filterId: Int, projectId: Int, filter: FilterInput, sort: SortTasksInput ): ExecTasks
task(id: Int!): Task
getNumberOfTasks( projectId: Int! ): Int!
`

export const TaskMutations = `
addTask( title: String!, important: Boolean, closeDate: String, assignedTo: [Int]!, company: Int!, deadline: String, description: String!, milestone: Int, overtime: Boolean!, pausal: Boolean!, pendingChangable: Boolean, pendingDate: String, project: Int!, requester: Int, status: Int!, tags: [Int]!, taskType: Int, repeat: TaskRepeatInput, comments: [CommentInput], scheduled: [ScheduledTaskInput], shortSubtasks: [ShortSubtaskInput], subtasks: [SubtaskInput], workTrips: [WorkTripInput], materials: [MaterialInput], customItems: [CustomItemInput] ): Task

updateTask( id: Int!, title: String, important: Boolean, closeDate: String, assignedTo: [Int], company: Int, deadline: String, description: String, milestone: Int, overtime: Boolean, pausal: Boolean, pendingChangable: Boolean, pendingDate: String, project: Int, requester: Int, status: Int, tags: [Int], taskType: Int, invoiced: Boolean ): Task
deleteTask( id: Int! ): Task
`

export const TaskSubscriptions = `
  taskSubscription( projectId: Int, filterId: Int, filter: FilterInput ): TasksDifference
`
