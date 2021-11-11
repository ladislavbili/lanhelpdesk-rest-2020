import moment from 'moment';
import { models } from '@/models';
import {
  toDBDate,
  createModelAttributes,
  generateFullNameSQL,
  removeLastComma,
} from '../sqlFunctions';

export const generateTaskSQL = (taskId, userId, companyId, isAdmin) => {

  const attributes = (
    `SELECT DISTINCT
    ${createModelAttributes("Task", null, models.Task)}
    ${createModelAttributes("Project", "Project", models.Project)}
    ${createModelAttributes("createdBy", "createdBy", models.User)}
    ${generateFullNameSQL("createdBy")}
    ${createModelAttributes("Milestone", "Milestone", models.Milestone)}
    ${createModelAttributes("requester", "requester", models.User)}
    ${generateFullNameSQL("requester")}
    ${createModelAttributes("Status", "Status", models.Status)}
    ${createModelAttributes("TaskType", "TaskType", models.TaskType)}
    ${createModelAttributes("Repeat", "Repeat", models.Repeat)}
    ${createModelAttributes("TaskMetadata", "TaskMetadata", models.TaskMetadata)}
    ${createModelAttributes("RepeatTime", "RepeatTime", models.RepeatTime)}
    `
  );


  const associations = (
    `
    INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"
    LEFT OUTER JOIN "task_attachments" AS "TaskAttachments" ON "Task"."id" = "TaskAttachments"."TaskId"
    LEFT OUTER JOIN "users" AS "createdBy" ON "Task"."createdById" = "createdBy"."id"
    LEFT OUTER JOIN "milestone" AS "Milestone" ON "Task"."MilestoneId" = "Milestone"."id"
    LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
    LEFT OUTER JOIN "statuses" AS "Status" ON "Task"."StatusId" = "Status"."id"
    LEFT OUTER JOIN "task_types" AS "TaskType" ON "Task"."TaskTypeId" = "TaskType"."id"
    LEFT OUTER JOIN "repeat" AS "Repeat" ON "Task"."RepeatId" = "Repeat"."id"
    LEFT OUTER JOIN "task_metadata" AS "TaskMetadata" ON "Task"."id" = "TaskMetadata"."TaskId"
    LEFT OUTER JOIN "repeat_times" AS "RepeatTime" ON "Task"."RepeatTimeId" = "RepeatTime"."id"

    LEFT OUTER JOIN "project_group" AS "Project->ProjectGroups" ON "Project"."id" = "Project->ProjectGroups"."ProjectId"
    LEFT OUTER JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
    LEFT OUTER JOIN (
      "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
    ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${userId}
    LEFT OUTER JOIN "company_belongs_to_group" AS "Project->ProjectGroups->Companies" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Companies"."ProjectGroupId" AND "Project->ProjectGroups->Companies"."CompanyId" = ${companyId}
    `
  )

  let sql = `
  ${attributes.slice(0, attributes.lastIndexOf(","))}
  FROM ( SELECT * FROM "tasks" WHERE "tasks"."id" = ${taskId} ) AS "Task"
  ${associations}
  ${isAdmin ?
      '' :
      ` WHERE (
      "Project->ProjectGroups->Users"."id" IS NOT NULL OR
      "Project->ProjectGroups->Companies"."CompanyId" IS NOT NULL
    )`
    }
  `;
  return sql.replace(/"/g, '`');
}

export const generateInvoicedTaskSQL = (taskId) => {
  const attributes = (
    `
    ${createModelAttributes("InvoicedTask", null, models.InvoicedTask)}
    ${createModelAttributes("Tags", "Tags", models.InvoicedTaskTag)}
    ${createModelAttributes("requester", "requester", models.InvoicedTaskUser)}
    ${createModelAttributes("assignedTos", "assignedTos", models.InvoicedTaskUser)}
    ${createModelAttributes("createdBy", "createdBy", models.InvoicedTaskUser)}
    `
  );

  let sql = `
  SELECT
  ${removeLastComma(attributes)}
  FROM
    "invoiced_tasks" AS "InvoicedTask"
    LEFT OUTER JOIN "invoiced_task_users" AS "createdBy" ON "createdBy"."createdById" = "InvoicedTask"."id"
    LEFT OUTER JOIN "invoiced_task_users" AS "requester" ON "requester"."requesterId" = "InvoicedTask"."id"
    LEFT OUTER JOIN "invoiced_task_users" AS "assignedTos" ON "assignedTos"."assignedToId" = "InvoicedTask"."id"
    LEFT OUTER JOIN "invoiced_task_tags" AS "Tags" ON "Tags"."InvoicedTaskId" = "InvoicedTask"."id"
  WHERE "InvoicedTask"."TaskId" = ${taskId}
  `;
  return sql.replace(/"/g, '`');
}

export const generateTaskAttachmentsSQL = (taskId) => {
  return `
  SELECT *
  FROM "task_attachments" AS "TaskAttachments"
  WHERE "TaskAttachments"."TaskId" = ${taskId}
  `.replace(/"/g, '`');
}

export const generateTagsSQL = (taskId) => {
  return `
  SELECT *
  FROM "tags" AS "Tags"
  INNER JOIN "task_has_tags" ON "task_has_tags"."TagId" = "Tags"."id" AND "task_has_tags"."TaskId" = ${taskId}
  `.replace(/"/g, '`');
}

export const generateAssignedTosSQL = (taskId) => {
  return `
  SELECT *,
  CONCAT( "assignedTos"."name", ' ' , "assignedTos"."surname" ) as fullName
  FROM "users" AS "assignedTos"
  INNER JOIN "task_assignedTo" ON "task_assignedTo"."UserId" = "assignedTos"."id" AND "task_assignedTo"."TaskId" = ${taskId}
  `.replace(/"/g, '`');
}

export const generateCompanySQL = (taskId) => {
  const attributes = (
    `
    ${createModelAttributes("Company", null, models.Company)}
    ${createModelAttributes("Pricelist", "Pricelist", models.Pricelist)}
    ${createModelAttributes("Pricelist->Prices", "Pricelist.Prices", models.Price)}
    ${createModelAttributes("Pricelist->Prices->TaskType", "Pricelist.Prices.TaskType", models.TaskType)}
    ${createModelAttributes("Pricelist->Prices->TripType", "Pricelist.Prices.TripType", models.TripType)}
    `
  );

  return `
  SELECT
  ${removeLastComma(attributes)}
  FROM "companies" AS "Company"
  INNER JOIN "tasks" AS "Task" ON "Company"."id" = "Task"."CompanyId" AND "Task"."id" = ${taskId}
  LEFT OUTER JOIN "pricelists" AS "Pricelist" ON "Company"."PricelistId" = "Pricelist"."id"
  LEFT OUTER JOIN "prices" AS "Pricelist->Prices" ON "Pricelist"."id" = "Pricelist->Prices"."PricelistId"
  LEFT OUTER JOIN "task_types" AS "Pricelist->Prices->TaskType" ON "Pricelist->Prices"."TaskTypeId" = "Pricelist->Prices->TaskType"."id"
  LEFT OUTER JOIN "trip_types" AS "Pricelist->Prices->TripType" ON "Pricelist->Prices"."TripTypeId" = "Pricelist->Prices->TripType"."id"
  `.replace(/"/g, '`');
}

export const generateShortSubtasksSQL = (taskId) => {
  return `
  SELECT *
  FROM "short_subtasks" AS "ShortSubtasks"
  WHERE "ShortSubtasks"."TaskId" = ${taskId}
  `.replace(/"/g, '`');
}

export const generateCompanyUsedTripPausalSQL = (companyId) => {
  return `
  SELECT
  COUNT("WorkTrips"."quantity") as "total"
  FROM "work_trips" AS "WorkTrips"
  INNER JOIN "tasks" AS "Task" ON "Task"."CompanyId" = ${companyId} AND "Task"."closeDate" >= '${toDBDate(moment().startOf('month').valueOf())}' AND "WorkTrips"."TaskId" = "Task"."id"
  `.replace(/"/g, '`');
}

export const generateCompanyUsedSubtaskPausalSQL = (companyId) => {
  return `
  SELECT
  COUNT("Subtasks"."quantity") as "total"
  FROM "subtasks" AS "Subtasks"
  INNER JOIN "tasks" AS "Task" ON "Task"."CompanyId" = ${companyId} AND "Task"."closeDate" >= '${toDBDate(moment().startOf('month').valueOf())}' AND "Subtasks"."TaskId" = "Task"."id"
  `.replace(/"/g, '`');
}

export const generateSubtasksSQL = (taskId) => {
  const attributes = (
    `
    ${createModelAttributes("Subtasks", null, models.Subtask)}
    ${createModelAttributes("TaskType", "TaskType", models.TaskType)}
    ${createModelAttributes("SubtaskApprovedBy", "SubtaskApprovedBy", models.User)}
    ${generateFullNameSQL("SubtaskApprovedBy")}
    ${createModelAttributes("User", "User", models.User)}
    ${generateFullNameSQL("User")}
    ${createModelAttributes("InvoicedTaskUser", "InvoicedTaskUser", models.InvoicedTaskUser)}
    ${createModelAttributes("User->Company", "User.Company", models.Company)}
    ${createModelAttributes("ScheduledWork", "ScheduledWork", models.ScheduledWork)}
    `
  )

  return `
  SELECT
  ${removeLastComma(attributes)}
  FROM (SELECT * FROM "subtasks" WHERE "subtasks"."TaskId" = ${taskId} ) AS "Subtasks"
  LEFT OUTER JOIN "task_types" AS "TaskType" ON "Subtasks"."TaskTypeId" = "TaskType"."id"
  LEFT OUTER JOIN "users" AS "SubtaskApprovedBy" ON "Subtasks"."SubtaskApprovedById" = "SubtaskApprovedBy"."id"
  LEFT OUTER JOIN "users" AS "User" ON "Subtasks"."UserId" = "User"."id"
  LEFT OUTER JOIN "companies" AS "User->Company" ON "User"."CompanyId" = "User->Company"."id"
  LEFT OUTER JOIN "scheduled_work" AS "ScheduledWork" ON "Subtasks"."id" = "ScheduledWork"."SubtaskId"

  LEFT OUTER JOIN "invoiced_task_users" AS "InvoicedTaskUser" ON "InvoicedTaskUser"."SubtaskId" = "Subtasks"."id"
  `.replace(/"/g, '`');
}

export const generateWorkTripsSQL = (taskId) => {
  const attributes = (
    `
    ${createModelAttributes("WorkTrips", null, models.WorkTrip)}
    ${createModelAttributes("TripType", "TripType", models.TaskType)}
    ${createModelAttributes("TripApprovedBy", "TripApprovedBy", models.User)}
    ${generateFullNameSQL("TripApprovedBy")}
    ${createModelAttributes("User", "User", models.User)}
    ${generateFullNameSQL("User")}
    ${createModelAttributes("InvoicedTaskUser", "InvoicedTaskUser", models.InvoicedTaskUser)}
    ${createModelAttributes("User->Company", "User.Company", models.Company)}
    ${createModelAttributes("ScheduledWork", "ScheduledWork", models.ScheduledWork)}
    `
  )

  return `
  SELECT
  ${removeLastComma(attributes)}
  FROM (SELECT * FROM "work_trips" WHERE "work_trips"."TaskId" = ${taskId} ) AS "WorkTrips"
  LEFT OUTER JOIN "trip_types" AS "TripType" ON "WorkTrips"."TripTypeId" = "TripType"."id"
  LEFT OUTER JOIN "users" AS "TripApprovedBy" ON "WorkTrips"."TripApprovedById" = "TripApprovedBy"."id"
  LEFT OUTER JOIN "users" AS "User" ON "WorkTrips"."UserId" = "User"."id"
  LEFT OUTER JOIN "companies" AS "User->Company" ON "User"."CompanyId" = "User->Company"."id"
  LEFT OUTER JOIN "scheduled_work" AS "ScheduledWork" ON "WorkTrips"."id" = "ScheduledWork"."WorkTripId"

  LEFT OUTER JOIN "invoiced_task_users" AS "InvoicedTaskUser" ON "InvoicedTaskUser"."WorkTripId" = "WorkTrips"."id"
  `.replace(/"/g, '`');
}

export const generateMaterialsSQL = (taskId) => {
  const attributes = (
    `
    ${createModelAttributes("Materials", null, models.Material)}
    ${createModelAttributes("MaterialApprovedBy", "MaterialApprovedBy", models.User)}
    ${generateFullNameSQL("MaterialApprovedBy")}
    `
  )

  return `
  SELECT
  ${removeLastComma(attributes)}
  FROM (SELECT * FROM "materials" WHERE "materials"."TaskId" = ${taskId} ) AS "Materials"
  LEFT OUTER JOIN "users" AS "MaterialApprovedBy" ON "Materials"."MaterialApprovedById" = "MaterialApprovedBy"."id"
  `.replace(/"/g, '`');
}
