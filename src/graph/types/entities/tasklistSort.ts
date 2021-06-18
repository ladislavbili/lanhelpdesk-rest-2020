import defaultAttributes from './defaultAttributes';
export const TasklistSort = `
type TasklistSort {
  ${defaultAttributes}
  layout: Int!
  sort: EnumSortTaskKey!
  asc: Boolean!
}
`

export const TasklistSortQuerries = `
`

export const TasklistSortMutations = `
`
