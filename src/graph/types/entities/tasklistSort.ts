import defaultAttributes from './defaultAttributes';
export const TasklistSort = `
type TasklistSort {
  ${defaultAttributes}
  layout: Int!
  sort: EnumSortTaskKey!
  asc: Boolean!
}
`

export const TasklistSortQueries = `
`

export const TasklistSortMutations = `
`
