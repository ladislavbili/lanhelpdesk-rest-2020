import defaultAttributes from './defaultAttributes';

export const Task = `
type Task {
  ${defaultAttributes}
  title: String!
  important: Boolean!,
  closeDate: Int
  assignedTo: [BasicUser]!
  company: Company!
  createdBy: BasicUser
  deadline: Int
  invoicedDate: Int
  description: String!
  milestone: Milestone
  overtime: Boolean!
  pausal: Boolean!
  pendingChangable: Boolean!
  pendingDate: Int
  project: Project!
  requester: BasicUser
  status: Status!
  statusChange: Int!
  tags: [Tag]!
  taskType: TaskType!

  repeat: Repeat
  comments: [Comment]!
  subtasks: [Subtask]!
  workTrips: [WorkTrip]!
  materials: [Material]!
  customItems: [CustomItem]!
}

type Repeat{
  repeatEvery: String!
  repeatInterval: EnumRepeatInterval!
  startsAt: String!
}

input RepeatInput{
  repeatEvery: String!
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
`
export const TaskQuerries = `
allTasks: [Task]
tasks( filterId: Int, projectId: Int ): [Task]
filteredTasks( filter: FilterInput, projectId: Int ): [Task]
task(id: Int!): Task
`

export const TaskMutations = `
addTask( title: String!, important: Boolean, closeDate: Int, assignedTo: [Int]!, company: Int!, deadline: Int, description: String!, milestone: Int, overtime: Boolean!, pausal: Boolean!, pendingChangable: Boolean, pendingDate: Int, project: Int!, requester: Int, status: Int!, tags: [Int]!, taskType: Int!, repeat: RepeatInput, comments: [CommentInput], subtasks: [SubtaskInput], workTrips: [WorkTripInput], materials: [MaterialInput], customItems: [CustomItemInput] ): Task
updateTask( id: Int!, title: String, important: Boolean, closeDate: Int, assignedTo: [Int], company: Int, deadline: Int, description: String, milestone: Int, overtime: Boolean, pausal: Boolean, pendingChangable: Boolean, pendingDate: Int, project: Int, requester: Int, status: Int, tags: [Int], taskType: Int, repeat: RepeatInput ): Task
deleteTask( id: Int! ): Task
`
