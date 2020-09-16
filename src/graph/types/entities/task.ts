import defaultAttributes from './defaultAttributes';

export const Task = `
type Task {
  ${defaultAttributes}
  title: String!
  important: Boolean!,
  closeDate: String
  assignedTo: [BasicUser]!
  company: Company!
  createdBy: BasicUser
  deadline: String
  invoicedDate: String
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
  taskType: TaskType!

  repeat: Repeat
  comments: [Comment]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
  customItems: [CustomItem]!
  calendarEvents: [CalendarEvent]!
  taskChanges: [TaskChange]!
}

type Repeat{
  repeatEvery: Int!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
}

input RepeatInput{
  repeatEvery: Int!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
}

input CommentInput{
  message: String!
  internal: Boolean!
}

input SubtaskInput{
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  type: Int!
  assignedTo: Int!
}

input WorkTripInput{
  order: Int!
  done: Boolean!
  quantity: Float!
  discount: Float!
  type: Int!
  assignedTo: Int!
}

input MaterialInput{
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  margin: Float!
  price: Float!
}

input CustomItemInput{
  title: String!
  order: Int!
  done: Boolean!
  quantity: Float!
  price: Float!
}

enum EnumRepeatInterval{
  week
  day
  month
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
`
export const TaskQuerries = `
allTasks: [Task]
tasks( filterId: Int, projectId: Int, filter: FilterInput ): [Task]
task(id: Int!): Task
`

export const TaskMutations = `
addTask( title: String!, important: Boolean, closeDate: String, assignedTo: [Int]!, company: Int!, deadline: String, description: String!, milestone: Int, overtime: Boolean!, pausal: Boolean!, pendingChangable: Boolean, pendingDate: String, project: Int!, requester: Int, status: Int!, tags: [Int]!, taskType: Int!, repeat: RepeatInput, comments: [CommentInput], subtasks: [SubtaskInput], workTrips: [WorkTripInput], materials: [MaterialInput], customItems: [CustomItemInput] ): Task
updateTask( id: Int!, title: String, important: Boolean, closeDate: String, assignedTo: [Int], company: Int, deadline: String, description: String, milestone: Int, overtime: Boolean, pausal: Boolean, pendingChangable: Boolean, pendingDate: String, project: Int, requester: Int, status: Int, tags: [Int], taskType: Int, repeat: RepeatInput ): Task
deleteTask( id: Int! ): Task
`

export const TaskSubscriptions = `
  taskSubscription( projectId: Int, filterId: Int, filter: FilterInput ): TasksDifference
`
