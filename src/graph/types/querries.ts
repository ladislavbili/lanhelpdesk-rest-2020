export default `
type Query {
  tasks(filter: String): [Task],
  task(id: Int!): Task,

  tags(filter: String): [Tag],
  tag(id: Int!): Tag,
}
`
