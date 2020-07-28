export default `
type ProjectRight {
  read: Boolean!
  write: Boolean!
  delete: Boolean!
  internal: Boolean!
  admin: Boolean!
  user: User!
}

input ProjectRightInput {
  read: Boolean!
  write: Boolean!
  delete: Boolean!
  internal: Boolean!
  admin: Boolean!
  UserId: Int!
}

type ProjectDefaults {
  assignedTo: ProjectAssignedTo!
  company: ProjectCompany!
  overtime: ProjectOvertime!
  pausal: ProjectPausal!
  requester: ProjectRequester!
  status: ProjectStatus!
  tag: ProjectTag!
  taskType: ProjectTaskType!
}

type ProjectAssignedTo {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: [User],
}

type ProjectCompany {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Company,
}

type ProjectOvertime {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Boolean,
}

type ProjectPausal {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Boolean,
}

type ProjectRequester {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: User,
}

type ProjectStatus {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Status,
}

type ProjectTag {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: [Tag],
}

type ProjectTaskType {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: TaskType,
}

input ProjectDefaultsInput {
  assignedTo: ProjectAssignedToUpdate!
  company: ProjectCompanyUpdate!
  overtime: ProjectOvertimeUpdate!
  pausal: ProjectPausalUpdate!
  requester: ProjectRequesterUpdate!
  status: ProjectStatusUpdate!
  tag: ProjectTagUpdate!
  taskType: ProjectTaskTypeUpdate!
}

input ProjectAssignedToUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: [Int],
}

input ProjectCompanyUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Int,
}

input ProjectOvertimeUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Boolean,
}

input ProjectPausalUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Boolean,
}

input ProjectRequesterUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Int,
}

input ProjectStatusUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Int,
}

input ProjectTagUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: [Int],
}

input ProjectTaskTypeUpdate {
  def: Boolean!,
  fixed: Boolean!,
  show: Boolean!,
  value: Int,
}
`
