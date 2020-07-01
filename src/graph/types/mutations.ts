export default `
type Mutation {
  addTask( title: String!, tags: [Int] ): Task,
  updateTask( id: Int!, title: String, tags: [Int] ): Task,

  addTag( title: String!, color: String ): Tag,
  updateTag( id: Int!, title: String, color: String ): Tag,
}
`
