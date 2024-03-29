import { models } from '@/models';

import {
  toDBDate,
  createModelAttributes,
  generateFullNameSQL,
  removeLastComma,
} from './sqlFunctions';

export const scheduledFilterSQL = (from, to, userId) => {
  let where = [];

  if (from && !to) {
    //from plati ak FROM je vacsi alebo rovnaky alebo TO je vacsi alebo rovnaky
    where.push(`(
      ("ScheduledWork"."from" >= '${toDBDate(from)}') OR
      ("ScheduledWork"."to" >= '${toDBDate(from)}')
    )`)
  }
  if (!from && to) {
    //to plati ak FROM je mensi alebo rovnaky alebo TO je mensi alebo rovnaky
    where.push(`(
      ("ScheduledWork"."from" <= '${toDBDate(to)}') OR
      ("ScheduledWork"."to" <= '${toDBDate(to)}')
    )`)
  };

  if (to && from) {
    where.push(`(
      (
        "ScheduledWork"."from" >= '${toDBDate(from)}'
        AND
        "ScheduledWork"."from" <= '${toDBDate(to)}'
      )
      OR
      (
        "ScheduledWork"."to" >= '${toDBDate(from)}'
        AND
        "ScheduledWork"."to" <= '${toDBDate(to)}'
      )
      OR
      (
        "ScheduledWork"."from" <= '${toDBDate(from)}'
        AND
        "ScheduledWork"."to" >= '${toDBDate(to)}'
      )
    )`)

  }

  if (userId) {
    where.push(`(
      "User"."id" = ${userId}
    )`)
  }

  //podmienky platia ak CONDITION je splneny alebo nema pravo scheduled citat
  return where;
}

//sort by start date
//get attributes, task - (title id) ,task status (id color title), start, end
export const createScheduledWorksSQL = (where, userId, companyId, isAdmin, ofSubtask) => {

  const origin = ofSubtask ? "Subtask" : "WorkTrip";

  let sql = `
  SELECT
  ${createModelAttributes("ScheduledWork", null, models.ScheduledWork)}
  ${createModelAttributes(origin, origin, models[origin])}
  ${ ofSubtask ? '' : createModelAttributes("TripType", "WorkTrip.TripType", models.TripType)}
  ${createModelAttributes("Task", "Task", models.Task)}
  ${createModelAttributes("User", "User", models.User)}
  ${ generateFullNameSQL('User')}
  (
    "Project->${isAdmin ? 'AdminProjectGroups' : 'ProjectGroups'}->ProjectGroupRight"."assignedEdit" AND
    "Project->${isAdmin ? 'AdminProjectGroups' : 'ProjectGroups'}->ProjectGroupRight"."taskWorksWrite" AND "Task"."invoiced" = false
  ) AS "canEdit",
  ${createModelAttributes("Task->Status", "Task.Status", models.Status)}
  "createdBy"."id" AS "createdBy.id",
  "TaskType"."id" AS "TaskType.id",
  "Project"."id" AS "Project.id",
  ${ isAdmin ?
      `
    ${createModelAttributes("Project->AdminProjectGroups->ProjectGroupRight", "Task.Project.AdminProjectGroup.ProjectGroupRight", models.ProjectGroupRights)}
    ` :
      ''
    }
  ${removeLastComma(createModelAttributes("Project->ProjectGroups->ProjectGroupRight", "Task.Project.ProjectGroups.ProjectGroupRight", models.ProjectGroupRights))}

  FROM "scheduled_work" AS "ScheduledWork"
  INNER JOIN ${ ofSubtask ? "subtasks" : "work_trips"} AS "${origin}" ON "ScheduledWork"."${origin}Id" = "${origin}"."id"
  ${ ofSubtask ? '' : `INNER JOIN "trip_types" AS "TripType" ON "WorkTrip"."TripTypeId" = "TripType"."id"`}
  INNER JOIN "tasks" AS "Task" ON "${origin}"."TaskId" = "Task"."id"
  INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"
  INNER JOIN "users" AS "User" ON "${origin}"."UserId" = "User"."id"
  ${ isAdmin ?
      `
    INNER JOIN "project_group" AS "Project->AdminProjectGroups" ON
    "Project"."id" = "Project->AdminProjectGroups"."ProjectId" AND
    "Project->AdminProjectGroups"."admin" = true AND
    "Project->AdminProjectGroups"."def" = true
    INNER JOIN "project_group_rights" AS "Project->AdminProjectGroups->ProjectGroupRight" ON "Project->AdminProjectGroups"."id" = "Project->AdminProjectGroups->ProjectGroupRight"."ProjectGroupId"
    ` :
      ''
    }
  LEFT OUTER JOIN "project_group" AS "Project->ProjectGroups" ON "Project"."id" = "Project->ProjectGroups"."ProjectId"
  LEFT OUTER JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
  LEFT OUTER JOIN(
    "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
  ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${userId}
  LEFT OUTER JOIN "company_belongs_to_group" AS "Project->ProjectGroups->Companies" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Companies"."ProjectGroupId" AND "Project->ProjectGroups->Companies"."CompanyId" = ${companyId}

  LEFT OUTER JOIN(
    "task_assignedTo" AS "assignedTosFilter->task_assignedTo" INNER JOIN "users" AS "assignedTosFilter" ON "assignedTosFilter"."id" = "assignedTosFilter->task_assignedTo"."UserId"
  ) ON "Task"."id" = "assignedTosFilter->task_assignedTo"."TaskId"
  LEFT OUTER JOIN "companies" AS "Company" ON "Task"."CompanyId" = "Company"."id"
  LEFT OUTER JOIN "users" AS "createdBy" ON "Task"."createdById" = "createdBy"."id"
  LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
  LEFT OUTER JOIN "statuses" AS "Task->Status" ON "Task"."StatusId" = "Task->Status"."id"
  LEFT OUTER JOIN(
    "task_has_tags" AS "tagsFilter->task_has_tags" INNER JOIN "tags" AS "tagsFilter" ON "tagsFilter"."id" = "tagsFilter->task_has_tags"."TagId"
  ) ON "Task"."id" = "tagsFilter->task_has_tags"."TaskId"
  LEFT OUTER JOIN "task_types" AS "TaskType" ON "Task"."TaskTypeId" = "TaskType"."id"
  `;
  if (where.length > 0) {
    sql = `
    ${ sql}
    WHERE ${ where.join(' AND ')}
    `;
  }
  sql = `
  ${ sql}
  GROUP BY "id"
  `;
  return sql.replace(/"/g, '`');
}
