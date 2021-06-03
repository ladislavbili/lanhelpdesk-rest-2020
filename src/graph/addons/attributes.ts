export const companyAttributes = [
  "id",
  "title",
  "dph",
  "ico",
  "dic",
  "ic_dph",
  "country",
  "city",
  "street",
  "zip",
  "email",
  "phone",
  "description",
  "monthly",
  "monthlyPausal",
  "taskWorkPausal",
  "taskTripPausal",
  "createdAt",
  "updatedAt",
  "PricelistId",
]

export const milestoneAttributes = [
  "id",
  "title",
  "description",
  "startsAt",
  "endsAt",
  "createdAt",
  "updatedAt",
  "ProjectId",
]

export const pricelistAttributes = [
  "id",
  "title",
  "order",
  "afterHours",
  "def",
  "materialMargin",
  "materialMarginExtra",
  "createdAt",
  "updatedAt",
]

export const priceAttributes = [
  "id",
  "price",
  "type",
  "createdAt",
  "updatedAt",
  "TaskTypeId",
  "TripTypeId",
  "PricelistId",
]

export const projectAttributes = [
  "id",
  "title",
  "description",
  "lockedRequester",
  "autoApproved",
  "defAssignedToDef",
  "defAssignedToFixed",
  "defAssignedToRequired",
  "defCompanyDef",
  "defCompanyFixed",
  "defCompanyRequired",
  "defOvertimeDef",
  "defOvertimeFixed",
  "defOvertimeRequired",
  "defOvertimeValue",
  "defPausalDef",
  "defPausalFixed",
  "defPausalRequired",
  "defPausalValue",
  "defRequesterDef",
  "defRequesterFixed",
  "defRequesterRequired",
  "defStatusDef",
  "defStatusFixed",
  "defStatusRequired",
  "defTagDef",
  "defTagFixed",
  "defTagRequired",
  "defTaskTypeDef",
  "defTaskTypeFixed",
  "defTaskTypeRequired",
  "createdAt",
  "updatedAt",
  "UserId",
  "defCompanyId",
  "defRequesterId",
  "defTaskTypeId",
  "TaskTypeId",
  "CompanyId",
]

export const projectGroupAttributes = [
  "id",
  "title",
  "order",
  "createdAt",
  "updatedAt",
  "ProjectId",
]

export const projectGroupRightsAttributes = [
  "id",
  "assignedRead",
  "assignedWrite",
  "companyRead",
  "companyWrite",
  "deadlineRead",
  "deadlineWrite",
  "milestoneRead",
  "milestoneWrite",
  "overtimeRead",
  "overtimeWrite",
  "pausalRead",
  "pausalWrite",
  "projectRead",
  "projectWrite",
  "projectPrimaryRead",
  "projectPrimaryWrite",
  "repeatRead",
  "repeatWrite",
  "requesterRead",
  "requesterWrite",
  "rozpocetRead",
  "rozpocetWrite",
  "scheduledRead",
  "scheduledWrite",
  "statusRead",
  "statusWrite",
  "tagsRead",
  "tagsWrite",
  "taskAttachmentsRead",
  "taskAttachmentsWrite",
  "taskDescriptionRead",
  "taskDescriptionWrite",
  "taskShortSubtasksRead",
  "taskShortSubtasksWrite",
  "typeRead",
  "typeWrite",
  "vykazRead",
  "vykazWrite",
  "addComments",
  "emails",
  "history",
  "internal",
  "projectSecondary",
  "pausalInfo",
  "taskTitleEdit",
  "viewComments",
  "companyTasks",
  "allTasks",
  "addTasks",
  "statistics",
  "deleteTasks",
  "important",
  "createdAt",
  "updatedAt",
  "ProjectGroupId",
]

export const repeatAttributes = [
  "id",
  "repeatEvery",
  "repeatInterval",
  "startsAt",
  "active",
  "createdAt",
  "updatedAt",
]

export const repeatTimeAttributes = [
  "id",
  "originalTrigger",
  "triggersAt",
  "triggered",
  "createdAt",
  "updatedAt",
  "RepeatId",
]

export const customItemAttributes = [
  "id",
  "title",
  "order",
  "done",
  "approved",
  "quantity",
  "price",
  "createdAt",
  "updatedAt",
  "UserId",
  "TaskId",
  "RepeatTemplateId",
  "ItemApprovedById",
]

export const materialAttributes = [
  "id",
  "title",
  "order",
  "done",
  "approved",
  "quantity",
  "margin",
  "price",
  "createdAt",
  "updatedAt",
  "UserId",
  "TaskId",
  "RepeatTemplateId",
  "MaterialApprovedById",
]

export const scheduledTaskAttributes = [
  "id",
  "createdAt",
  "updatedAt",
  "TaskId",
  "UserId",
  "from",
  "to"
]

export const scheduledWorkAttributes = [
  "id",
  "createdAt",
  "updatedAt",
  "from",
  "to"
]

export const statusAttributes = [
  "id",
  "title",
  "order",
  "template",
  "color",
  "icon",
  "action",
  "createdAt",
  "updatedAt",
  "ProjectId",
  "defStatusId",
  "projectStatusId",
]

export const subtaskAttributes = [
  "id",
  "title",
  "order",
  "done",
  "approved",
  "quantity",
  "discount",
  "invoiced",
  "createdAt",
  "updatedAt",
  "UserId",
  "TaskTypeId",
  "TaskId",
  "RepeatTemplateId",
  "SubtaskApprovedById",
]

export const tagAttributes = [
  "id",
  "title",
  "color",
  "order",
  "createdAt",
  "updatedAt",
  "ProjectId",
  "ofProjectId",
]

export const taskAttributes = [
  "id",
  "title",
  "important",
  "closeDate",
  "deadline",
  "description",
  "overtime",
  "pausal",
  "pendingChangable",
  "pendingDate",
  "statusChange",
  "invoicedDate",
  "invoiced",
  "createdAt",
  "updatedAt",
  "UserId",
  "ProjectId",
  "TaskTypeId",
  "CompanyId",
  "StatusId",
  "MilestoneId",
  "createdById",
  "requesterId",
  "RepeatId",
]

export const taskAttachmentAttributes = [
  "id",
  "filename",
  "mimetype",
  "encoding",
  "createdAt",
  "updatedAt",
  "UserId",
  "TaskId",
  "path",
  "size",
]

export const taskMetadataAttributes = [
  "id",
  "subtasksApproved",
  "subtasksPending",
  "tripsApproved",
  "tripsPending",
  "materialsApproved",
  "materialsPending",
  "itemsApproved",
  "itemsPending",
  "createdAt",
  "updatedAt",
  "TaskId",
]

export const taskTypeAttributes = [
  "id",
  "title",
  "order",
  "createdAt",
  "updatedAt",
]

export const tripTypeAttributes = [
  "id",
  "title",
  "order",
  "createdAt",
  "updatedAt",
]

export const userAttributes = [
  "id",
  "active",
  "username",
  "email",
  "name",
  "surname",
  "password",
  "receiveNotifications",
  "signature",
  "tokenKey",
  "language",
  "tasklistLayout",
  "taskLayout",
  "createdAt",
  "updatedAt",
  "RoleId",
  "CompanyId",
]

export const workTripAttributes = [
  "id",
  "order",
  "done",
  "approved",
  "quantity",
  "discount",
  "createdAt",
  "updatedAt",
  "UserId",
  "TripTypeId",
  "TaskId",
  "RepeatTemplateId",
  "TripApprovedById",
]


//filter
export const assignedTosFilterAttributes = [
  "id",
  "name",
  "surname",
];

//map tables
export const assignedTosTaskMapAttributes = [
  "UserId",
  "TaskId",
];

export const userBelongsToGroupAttributes = [
  "createdAt",
  "updatedAt",
  "UserId",
  "ProjectGroupId",
]

export const tagsTaskMapAttributes = [
  "TagId",
  "TaskId",
]
