import defaultAttributes from './defaultAttributes';

export default `
type Tag {
  ${defaultAttributes}
  title: String!,
  color: String!,
  tasks: [Task],
}
`
