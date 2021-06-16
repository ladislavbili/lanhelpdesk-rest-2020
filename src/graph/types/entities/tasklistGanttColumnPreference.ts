import defaultAttributes from './defaultAttributes';

export const TasklistGanttColumnPreference = `
type TasklistGanttColumnPreference{
  ${defaultAttributes}
  taskId: Boolean!
  status: Boolean!
  important: Boolean!
  invoiced: Boolean!
  requester: Boolean!
  company: Boolean!
  assignedTo: Boolean!
  scheduled: Boolean!
  createdAtV: Boolean!
  taskType: Boolean!
  overtime: Boolean!
  pausal: Boolean!
  tags: Boolean!
  works: Boolean!
  trips: Boolean!
  materialsWithoutDPH: Boolean!
  materialsWithDPH: Boolean!
  Project: Project
}
`

export const TasklistGanttColumnPreferenceQuerries = `
tasklistGanttColumnPreference( projectId: Int ): TasklistGanttColumnPreference
`

export const TasklistGanttColumnPreferenceMutations = `
addOrUpdateTasklistGanttColumnPreference(
  projectId: Int
  taskId: Boolean
  status: Boolean
  important: Boolean
  invoiced: Boolean
  requester: Boolean
  company: Boolean
  assignedTo: Boolean
  scheduled: Boolean
  createdAtV: Boolean
  taskType: Boolean
  overtime: Boolean
  pausal: Boolean
  tags: Boolean
  works: Boolean
  trips: Boolean
  materialsWithoutDPH: Boolean
  materialsWithDPH: Boolean
): TasklistGanttColumnPreference
`
