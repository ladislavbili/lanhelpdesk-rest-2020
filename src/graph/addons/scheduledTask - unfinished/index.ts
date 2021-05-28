import {
  scheduledTaskAttributes,
  taskAttributes,
  userAttributes,
  companyAttributes,
  statusAttributes,
  projectGroupRightAttributes,
} from './attributes';
const toDBDate = (date) => (new Date(date)).toISOString().slice(0, 19).replace('T', ' ');

const createAttributesFromItem = (associationName, newAssociationName, attributes) => {
  return `
  ${attributes.reduce(
      (acc, attribute) => `${acc}"${associationName}"."${attribute}" AS "${newAssociationName}.${attribute}",
    `, ""
    )}
  `
}

const generateFullNameSQL = (source, target) => {
  return ` CONCAT( "${source}"."name", ' ' , "${source}"."surname" ) as "${target}.fullName"`;
}


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
    where.push(`(
      "Subtask"."UserId" = ${userId}
      OR
      "WorkTrip"."UserId" = ${userId}
      )`)
  }

  //podmienky platia ak CONDITION je splneny alebo nema pravo scheduled citat
  return where;
}


export const createScheduledTasksSQL = (where, currentUserId, isAdmin) => {

  const notAdminWhere = `
  ${ where.length > 0 ? 'AND ' : ''}
  `;

  let sql = `
  SELECT
  ${ scheduledTaskAttributes.reduce(
      (acc, attribute) => `${acc}"ScheduledTask"."${attribute}",
    ` , ""
    )}

  ${createAttributesFromItem("Subtask->Task", "Subtask.Task", taskAttributes)}
  ${createAttributesFromItem("WorkTrip->Task", "WorkTrip.Task", taskAttributes)}
  ${createAttributesFromItem("Subtask->User", "Subtask.User", userAttributes)}
  ${ generateFullNameSQL('Subtask->User', 'Subtask.User')}
  ${createAttributesFromItem("WorkTrip->User", "WorkTrip.User", userAttributes)}
  ${ generateFullNameSQL('WorkTrip->User', 'WorkTrip.User')}
  (
    "Subtask->Task->Project->ProjectGroups->ProjectGroupRight"."assignedWrite"
    OR
    "WorkTrip->Task->Project->ProjectGroups->ProjectGroupRight"."assignedWrite"
  ) AS "canEdit",
  ${createAttributesFromItem("assignedTosFilter", "assignedTosFilter", userAttributes)}
  "assignedTosFilter->task_assignedTo"."UserId" AS "assignedTosFilter.task_assignedTo.UserId",
  "assignedTosFilter->task_assignedTo"."TaskId" AS "assignedTosFilter.task_assignedTo.TaskId",
  ${createAttributesFromItem("Company", "Company", companyAttributes)}
  "createdBy"."id" AS "createdBy.id",
  ${createAttributesFromItem("requester", "requester", userAttributes)}
  ${createAttributesFromItem("Subtask->Task->Status", "Subtask.Task.Status", statusAttributes)}
  ${createAttributesFromItem("WorkTrip->Task->Status", "WorkTrip.Task.Status", statusAttributes)}

  "tagsFilter"."id" AS "tagsFilter.id",
  "TaskType"."id" AS "TaskType.id",
  "Project"."id" AS "Project.id",
  "Project->ProjectGroups"."id" AS "Project.ProjectGroups.id",
  "Project->ProjectGroups"."ProjectId" AS "Project.ProjectGroups.ProjectId",
  ${createAttributesFromItem("Subtask->Task->Project->ProjectGroups->ProjectGroupRight", "Subtask.Task.Project.ProjectGroups.ProjectGroupRight", projectGroupRightAttributes)}
  ${createAttributesFromItem("WorkTrip->Task->Project->ProjectGroups->ProjectGroupRight", "WorkTrip.Task.Project.ProjectGroups.ProjectGroupRight", projectGroupRightAttributes)}
  "Project->ProjectGroups->Users"."id" AS "Project.ProjectGroups.Users.id",
  "Project->ProjectGroups->Users->user_belongs_to_group"."UserId" AS "Project.ProjectGroups.Users.user_belongs_to_group.UserId",
  "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AS "Project.ProjectGroups.Users.user_belongs_to_group.ProjectGroupId"





  FROM "scheduled_task" AS "ScheduledTask"
  LEFT OUTER JOIN "subtasks" AS "Subtask" ON "ScheduledTask"."SubtaskId" = "Subtask"."id"
  LEFT OUTER JOIN "work_trips" AS "WorkTrip" ON "ScheduledTask"."WorkTripId" = "Subtask"."id"
  INNER JOIN "tasks" AS "Subtask->Task" ON "Subtask"."TaskId" = "Subtask->Task"."id"
  INNER JOIN "tasks" AS "WorkTrip->Task" ON "WorkTrip"."TaskId" = "WorkTrip->Task"."id"
  INNER JOIN "projects" AS "Subtask->Task->Project" ON "Subtask->Task"."ProjectId" = "Subtask->Task->Project"."id"
  INNER JOIN "projects" AS "WorkTrip->Task->Project" ON "WorkTrip->Task"."ProjectId" = "WorkTrip->Task->Project"."id"




  INNER JOIN "users" AS "User" ON "ScheduledTask"."UserId" = "User"."id"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group" AS "Project->ProjectGroups" ON "Project"."id" = "Project->ProjectGroups"."ProjectId"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN "project_group_rights" AS "Project->ProjectGroups->ProjectGroupRight" ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->ProjectGroupRight"."ProjectGroupId"
  ${ isAdmin ? 'LEFT OUTER' : 'INNER'} JOIN(
    "user_belongs_to_group" AS "Project->ProjectGroups->Users->user_belongs_to_group" INNER JOIN "users" AS "Project->ProjectGroups->Users" ON "Project->ProjectGroups->Users"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."UserId"
  ) ON "Project->ProjectGroups"."id" = "Project->ProjectGroups->Users->user_belongs_to_group"."ProjectGroupId" AND "Project->ProjectGroups->Users"."id" = ${ currentUserId}

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
