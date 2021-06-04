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
    from = new Date(from);
    //from plati ak FROM je vacsi alebo rovnaky alebo TO je vacsi alebo rovnaky
    where.push(`(
      ("ScheduledTask"."from" >= '${toDBDate(from)}') OR
      ("ScheduledTask"."to" >= '${toDBDate(from)}')
    )`)
  }
  if (!from && to) {
    to = new Date(to);
    //to plati ak FROM je mensi alebo rovnaky alebo TO je mensi alebo rovnaky
    where.push(`(
      ("ScheduledTask"."from" <= '${toDBDate(to)}') OR
      ("ScheduledTask"."to" <= '${toDBDate(to)}')
    )`)
  };

  if (to && from) {
    from = new Date(from);
    to = new Date(to);

    where.push(`(
      (
        "ScheduledTask"."from" >= '${toDBDate(from)}'
        AND
        "ScheduledTask"."from" <= '${toDBDate(to)}'
      )
      OR
      (
        "ScheduledTask"."to" >= '${toDBDate(from)}'
        AND
        "ScheduledTask"."to" <= '${toDBDate(to)}'
      )
      OR
      (
        "ScheduledTask"."from" <= '${toDBDate(from)}'
        AND
        "ScheduledTask"."to" >= '${toDBDate(to)}'
      )
    )`)

  }

  if (userId) {
    where.push(`"User"."id" = ${userId} `)
  }

  //podmienky platia ak CONDITION je splneny alebo nema pravo scheduled citat
  return where;
}

export const createScheduledTasksSQL = (where, currentUserId, isAdmin) => {
  //sort by start date
  //get attributes, task - (title id) ,task status (id color title), start, end

  const notAdminWhere = `
  ${ where.length > 0 ? 'AND ' : ''}
  `;

  let sql = `
  SELECT
  ${createModelAttributes("ScheduledTask", null, models.ScheduledTask)}
  ${createModelAttributes("Task", "Task", models.Task)}
  ${createModelAttributes("User", "User", models.User)}
  ${ generateFullNameSQL('User')}
  "Project->ProjectGroups->ProjectGroupRight"."assignedWrite" AS "canEdit",
  ${createModelAttributes("assignedTosFilter", "assignedTosFilter", models.User)}
  ${createModelAttributes("assignedTosFilter->task_assignedTo", "assignedTosFilter.task_assignedTo", null, 'assignedTosTaskMapAttributes')}
  ${createModelAttributes("Company", "Company", models.Company)}
  ${createModelAttributes("requester", "requester", models.User)}
  ${createModelAttributes("Status", "Status", models.Status)}
  "createdBy"."id" AS "createdBy.id",
  "tagsFilter"."id" AS "tagsFilter.id",
  "TaskType"."id" AS "TaskType.id",
  "Project"."id" AS "Project.id",
  ${createModelAttributes("Project->ProjectGroups", "Project.ProjectGroups", models.ProjectGroups)}
  ${createModelAttributes("Project->ProjectGroups->ProjectGroupRight", "Project.ProjectGroups.ProjectGroupRight", models.ProjectGroupRights)}
  "Project->ProjectGroups->Users"."id" AS "Project.ProjectGroups.Users.id",
  ${removeLastComma(createModelAttributes("Project->ProjectGroups->Users->user_belongs_to_group", "Project.ProjectGroups.Users.user_belongs_to_group", null, 'userBelongsToGroupAttributes'))}

  FROM "scheduled_task" AS "ScheduledTask"
  INNER JOIN "tasks" AS "Task" ON "ScheduledTask"."TaskId" = "Task"."id"
  INNER JOIN "projects" AS "Project" ON "Task"."ProjectId" = "Project"."id"
  INNER JOIN "users" AS "User" ON "ScheduledTask"."UserId" = "User"."id"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group" AS "Project->ProjectGroups" ON "Project"."id" = "Project->ProjectGroups"."ProjectId"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN(
    "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
  ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${currentUserId}

  LEFT OUTER JOIN(
    "task_assignedTo" AS "assignedTosFilter->task_assignedTo" INNER JOIN "users" AS "assignedTosFilter" ON "assignedTosFilter"."id" = "assignedTosFilter->task_assignedTo"."UserId"
  ) ON "Task"."id" = "assignedTosFilter->task_assignedTo"."TaskId"
  LEFT OUTER JOIN "companies" AS "Company" ON "Task"."CompanyId" = "Company"."id"
  LEFT OUTER JOIN "users" AS "createdBy" ON "Task"."createdById" = "createdBy"."id"
  LEFT OUTER JOIN "users" AS "requester" ON "Task"."requesterId" = "requester"."id"
  LEFT OUTER JOIN "statuses" AS "Status" ON "Task"."StatusId" = "Status"."id"
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
