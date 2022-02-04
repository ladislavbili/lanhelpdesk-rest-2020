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
  startsAt: Boolean!
  deadline: Boolean!
  project: Boolean!
  milestone: Boolean!
  taskType: Boolean!
  overtime: Boolean!
  pausal: Boolean!
  tags: Boolean!
  statistics: Boolean!
  works: Boolean!
  trips: Boolean!
  materialsWithoutDPH: Boolean!
  materialsWithDPH: Boolean!
  repeat: Boolean!
  Project: Project
}
`

export const TasklistColumnPreferenceQueries = `
tasklistColumnPreference( projectId: Int ): TasklistColumnPreference
`

export const TasklistColumnPreferenceMutations = `
addOrUpdateTasklistColumnPreference(
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
  startsAt: Boolean
  deadline: Boolean
  project: Boolean
  milestone: Boolean
  taskType: Boolean
  overtime: Boolean
  pausal: Boolean
  tags: Boolean
  statistics: Boolean
  works: Boolean
  trips: Boolean
  materialsWithoutDPH: Boolean
  materialsWithDPH: Boolean
  repeat: Boolean
): TasklistColumnPreference
`
