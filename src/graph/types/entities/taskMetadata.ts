import defaultAttributes from './defaultAttributes';
export const TaskMetadata = `
type TaskMetadata {
  ${defaultAttributes}
  subtasksApproved: Float!
  subtasksPending: Float!
  tripsApproved: Float!
  tripsPending: Float!
  materialsApproved: Float!
  materialsPending: Float!
  itemsApproved: Float!
  itemsPending: Float!
}
`

export const TaskMetadataQuerries = `
`

export const TaskMetadataMutations = `
`
