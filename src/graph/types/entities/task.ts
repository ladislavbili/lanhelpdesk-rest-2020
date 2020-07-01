import defaultAttributes from './defaultAttributes';

export default `
type Task {
  ${defaultAttributes}
  title: String!,
  tags: [Tag],
}
`
