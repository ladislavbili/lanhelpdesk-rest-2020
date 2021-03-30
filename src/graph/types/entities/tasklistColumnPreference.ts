import defaultAttributes from './defaultAttributes';

export const TasklistColumnPreference = `
type TasklistColumnPreference{
  ${defaultAttributes}
  taskId: Boolean!
  status: Boolean!
  important: Boolean!
  invoiced: Boolean!
  title: Boolean!
  requester: Boolean!
  company: Boolean!
  assignedTo: Boolean!
  createdAtV: Boolean!
  deadline: Boolean!
  project: Boolean!
  milestone: Boolean!
  taskType: Boolean!
  overtime: Boolean!
  pausal: Boolean!
  tags: Boolean!
  statistics: Boolean!
  Project: Project
}

`

export const TasklistColumnPreferenceQuerries = `
tasklistColumnPreference( projectId: Int ): TasklistColumnPreference
`

export const TasklistColumnPreferenceMutations = `
addOrUpdateTasklistColumnPerference(
  projectId: Int
  taskId: Boolean
  status: Boolean
  important: Boolean
  invoiced: Boolean
  title: Boolean
  requester: Boolean
  company: Boolean
  assignedTo: Boolean
  createdAtV: Boolean
  deadline: Boolean
  project: Boolean
  milestone: Boolean
  taskType: Boolean
  overtime: Boolean
  pausal: Boolean
  tags: Boolean
  statistics: Boolean
): TasklistColumnPreference
`
