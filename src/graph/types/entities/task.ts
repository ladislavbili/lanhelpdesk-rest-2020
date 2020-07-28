import defaultAttributes from './defaultAttributes';

export const Task = `
type Task {
  ${defaultAttributes}
  title: String!
  tags: [Tag]
}
`
export const TaskQuerries = `
tasks(filter: String): [Task]
task(id: Int!): Task
`

export const TaskMutations = `
addTask( title: String!, tags: [Int] ): Task
updateTask( id: Int!, title: String, tags: [Int] ): Task
`
