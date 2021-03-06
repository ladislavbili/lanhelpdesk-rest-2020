export default `
type ProjectDefaults {
  status: ProjectStatus!
  requester: ProjectRequester!
  company: ProjectCompany!
  overtime: ProjectOvertime!
  pausal: ProjectPausal!
  type: ProjectTaskType!
  assignedTo: ProjectAssignedTo!
  tag: ProjectTag!
}

type ProjectAssignedTo {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: [User],
}

type ProjectCompany {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Company,
}

type ProjectOvertime {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Boolean,
}

type ProjectPausal {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Boolean,
}

type ProjectRequester {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: User,
}

type ProjectStatus {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Status,
}

type ProjectTag {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: [Tag],
}

type ProjectTaskType {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
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
  type: ProjectTaskTypeUpdate!
}

input ProjectAssignedToUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: [Int],
}

input ProjectCompanyUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Int,
}

input ProjectOvertimeUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Boolean,
}

input ProjectPausalUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Boolean,
}

input ProjectRequesterUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Int,
}

input ProjectStatusUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Int,
}

input ProjectTagUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: [Int],
}

input ProjectTaskTypeUpdate {
  def: Boolean!,
  fixed: Boolean!,
  required: Boolean!,
  value: Int,
}
`
