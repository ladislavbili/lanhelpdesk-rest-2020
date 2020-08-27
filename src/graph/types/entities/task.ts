import defaultAttributes from './defaultAttributes';

export const Task = `
type Task {
  ${defaultAttributes}
  title: String!
  closeDate: Int
  assignedTo: [BasicUser]!
  company: Company!
  createdBy: BasicUser
  deadline: Int
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
addTask( title: String!, closeDate: Int, assignedTo: [Int]!, company: Int!, deadline: Int, description: String!, milestone: Int, overtime: Boolean!, pausal: Boolean!, pendingChangable: Boolean, pendingDate: Int, project: Int!, requester: Int, status: Int!, tags: [Int]!, taskType: Int!, repeat: RepeatInput ): Task
updateTask( id: Int!, title: String, closeDate: Int, assignedTo: [Int], company: Int, deadline: Int, description: String, milestone: Int, overtime: Boolean, pausal: Boolean, pendingChangable: Boolean, pendingDate: Int, project: Int, requester: Int, status: Int, tags: [Int], taskType: Int, repeat: RepeatInput ): Task
deleteTask( id: Int! ): Task
`
